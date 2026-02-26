<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Disable display errors
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Auth Middleware
if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if (is_array($decoded)) $user = $decoded;
    elseif (is_object($decoded)) $user = (array)$decoded;
}

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// --- HELPER: Get effective schedule for a date ---
function getEffectiveSchedule($pdo, $instructorId, $date) {
    // 1. Check Specific Date Override
    $stmtSpec = $pdo->prepare("SELECT start_time, end_time, is_active FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
    $stmtSpec->execute([$instructorId, $date]);
    $specific = $stmtSpec->fetch();

    if ($specific) {
        return $specific; // Can be is_active=0 (Blocked)
    }

    // 2. Fallback to Weekly Template
    $dow = date('w', strtotime($date));
    $stmtAvail = $pdo->prepare("SELECT start_time, end_time, is_active FROM availabilities WHERE instructor_id = ? AND day_of_week = ?");
    $stmtAvail->execute([$instructorId, $dow]);
    $weekly = $stmtAvail->fetch();

    if ($weekly) {
        return $weekly;
    }

    // 3. Default: Not available
    return null;
}

// --- POST: Save Availability (Merged Logic) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($user['role'] !== 'instructor') { http_response_code(403); exit; }

    $input = json_decode(file_get_contents('php://input'), true);
    $mode = $_GET['mode'] ?? 'default'; // 'default' (weekly) or 'date' (specific)

    try {
        $pdo->beginTransaction();

        // Ensure table exists (Lazy Migration)
        $pdo->exec("CREATE TABLE IF NOT EXISTS instructor_schedules (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            tenant_id VARCHAR(36) NOT NULL,
            instructor_id VARCHAR(36) NOT NULL,
            schedule_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
            UNIQUE KEY idx_instr_date (instructor_id, schedule_date)
        )");

        // Get Instructor ID
        $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
        $instStmt->execute([$user['sub']]);
        $instructorId = $instStmt->fetchColumn();
        if (!$instructorId) throw new Exception("Instructor profile not found");

        if ($mode === 'date') {
            // Save specific date(s)
            // Expect: { date: '2025-02-26', start: '09:00', end: '18:00', active: true }
            if (empty($input['date'])) throw new Exception("Date required");

            $stmt = $pdo->prepare("REPLACE INTO instructor_schedules (id, tenant_id, instructor_id, schedule_date, start_time, end_time, is_active) VALUES (UUID(), ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $user['tenant_id'],
                $instructorId,
                $input['date'],
                $input['start'] ?? '09:00',
                $input['end'] ?? '18:00',
                $input['active'] ? 1 : 0
            ]);
        } else {
            // Save weekly template (Legacy/Default)
            // Expect: [{ day: 1, start: '09:00', end: '18:00', active: true }, ...]
            $delStmt = $pdo->prepare("DELETE FROM availabilities WHERE instructor_id = ?");
            $delStmt->execute([$instructorId]);

            $insStmt = $pdo->prepare("INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time, is_active) VALUES (UUID(), ?, ?, ?, ?, ?, ?)");

            foreach ($input as $slot) {
                if ($slot['active']) {
                    $insStmt->execute([
                        $user['tenant_id'],
                        $instructorId,
                        $slot['day'],
                        $slot['start'],
                        $slot['end'],
                        1
                    ]);
                }
            }
        }

        $pdo->commit();
        echo json_encode(['message' => 'Availability saved']);

    } catch (\Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- GET: Fetch Availability ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // Mode: Config (Get specific date details + weekly defaults)
    if (isset($_GET['mode']) && $_GET['mode'] === 'details') {
        $date = $_GET['date'] ?? date('Y-m-d');
        // Check specific first
        // ... logic to return what is currently active for this date (inherited or override)
        // For editor UI: return both if override exists?
        // Let's return the effective schedule for this date

        $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
        $instStmt->execute([$user['sub']]);
        $instructorId = $instStmt->fetchColumn();

        $schedule = getEffectiveSchedule($pdo, $instructorId, $date);

        // Also fetch the specific row to know if it's an override
        $stmtSpec = $pdo->prepare("SELECT * FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
        $stmtSpec->execute([$instructorId, $date]);
        $override = $stmtSpec->fetch();

        echo json_encode([
            'effective' => $schedule,
            'is_override' => !!$override,
            'override_data' => $override
        ]);
        exit;
    }

    // Mode: Month (Get available days for calendar - Student & Instructor View)
    if (isset($_GET['mode']) && $_GET['mode'] === 'month') {
        $instructorId = $_GET['instructorId'] ?? null;
        $month = $_GET['month'] ?? date('m');
        $year = $_GET['year'] ?? date('Y');

        if (!$instructorId) { echo json_encode([]); exit; }

        try {
            // Get Weekly Template
            $stmtAvail = $pdo->prepare("SELECT day_of_week FROM availabilities WHERE instructor_id = ? AND is_active = 1");
            $stmtAvail->execute([$instructorId]);
            $weeklyDays = $stmtAvail->fetchAll(PDO::FETCH_COLUMN);

            // Get Specific Overrides for this month
            $startMonth = "$year-$month-01";
            $endMonth = date('Y-m-t', strtotime($startMonth));

            $stmtSpec = $pdo->prepare("SELECT schedule_date, is_active FROM instructor_schedules WHERE instructor_id = ? AND schedule_date BETWEEN ? AND ?");
            $stmtSpec->execute([$instructorId, $startMonth, $endMonth]);
            $overrides = $stmtSpec->fetchAll(PDO::FETCH_KEY_PAIR); // date => is_active

            $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
            $availableDates = [];

            for ($d = 1; $d <= $daysInMonth; $d++) {
                $dateStr = sprintf("%04d-%02d-%02d", $year, $month, $d);
                $dow = date('w', strtotime($dateStr));

                $isAvailable = false;

                if (isset($overrides[$dateStr])) {
                    // Explicit override
                    $isAvailable = (bool)$overrides[$dateStr];
                } else {
                    // Fallback to weekly
                    $isAvailable = in_array($dow, $weeklyDays);
                }

                if ($isAvailable) {
                    $availableDates[] = $dateStr;
                }
            }

            echo json_encode($availableDates);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        exit;
    }

    // Mode: Slots (Student viewing slots for date)
    $instructorId = $_GET['instructorId'] ?? null;
    $date = $_GET['date'] ?? null;

    if (!$instructorId || !$date) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing params']);
        exit;
    }

    try {
        $schedule = getEffectiveSchedule($pdo, $instructorId, $date);

        if (!$schedule || !$schedule['is_active']) {
            echo json_encode([]);
            exit;
        }

        $slots = [];
        // Ensure times are clean (H:i:s or H:i)
        $startStr = $schedule['start_time'];
        $endStr = $schedule['end_time'];

        $startTs = strtotime("$date $startStr");
        $endTs = strtotime("$date $endStr");

        // Validate timestamp generation
        if (!$startTs || !$endTs || $startTs >= $endTs) {
             echo json_encode([]);
             exit;
        }

        $stmtBooked = $pdo->prepare("SELECT start_time FROM bookings WHERE instructor_id = ? AND booking_date = ? AND status != 'cancelled'");
        $stmtBooked->execute([$instructorId, $date]);
        $bookedTimes = $stmtBooked->fetchAll(PDO::FETCH_COLUMN);

        $bookedTimes = array_map(function($t) { return date('H:i:00', strtotime($t)); }, $bookedTimes);

        while ($startTs < $endTs) {
            // Check if 60 min class fits
            if (strtotime('+60 minutes', $startTs) > $endTs) break;

            $timeStr = date('H:i', $startTs);
            $dbTimeStr = date('H:i:00', $startTs);

            $isBooked = in_array($dbTimeStr, $bookedTimes);
            $isPast = (date('Y-m-d') === $date && $startTs < time());

            if (!$isBooked && !$isPast) {
                 $slots[] = $timeStr;
            }

            $startTs = strtotime('+1 hour', $startTs);
        }

        echo json_encode($slots);

    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
