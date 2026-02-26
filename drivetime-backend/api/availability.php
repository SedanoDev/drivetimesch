<?php
// api/availability.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Disable display errors to prevent JSON corruption
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    try {
        $decoded = JWT::decode($matches[1], $jwt_secret_key);
        $user = (array)$decoded;
    } catch (Exception $e) { }
}

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Helper: Get effective schedule for a date
function getEffectiveSchedule($pdo, $instructorId, $date) {
    // 1. Check Specific Date Override
    try {
        $stmtSpec = $pdo->prepare("SELECT start_time, end_time, is_active FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
        $stmtSpec->execute([$instructorId, $date]);
        $specific = $stmtSpec->fetch(PDO::FETCH_ASSOC);

        if ($specific) {
            return $specific;
        }

        // 2. Fallback to Weekly Template
        $dow = date('w', strtotime($date));
        // Convert PHP Sunday (0) to potential DB mismatch if DB uses 1-7? No, usually 0-6 or 1-7.
        // Assuming 0=Sunday, 1=Monday... let's match DB constraint.
        // In schema: day_of_week TINYINT CHECK (0-6)

        $stmtAvail = $pdo->prepare("SELECT start_time, end_time, is_active FROM availabilities WHERE instructor_id = ? AND day_of_week = ?");
        $stmtAvail->execute([$instructorId, $dow]);
        $weekly = $stmtAvail->fetch(PDO::FETCH_ASSOC);

        if ($weekly) {
            return $weekly;
        }
    } catch (Exception $e) {
        return null;
    }
    return null;
}

// --- POST: Save Availability ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($user['role'] !== 'instructor') { http_response_code(403); echo json_encode(['error'=>'Role']); exit; }

    $input = json_decode(file_get_contents('php://input'), true);
    $mode = $_GET['mode'] ?? 'default';

    try {
        // Get Instructor ID
        $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
        $instStmt->execute([$user['sub']]);
        $instructorId = $instStmt->fetchColumn();

        if (!$instructorId) {
            http_response_code(404);
            echo json_encode(['error' => 'Instructor profile not found']);
            exit;
        }

        $pdo->beginTransaction();

        if ($mode === 'date') {
            // Validate
            if (empty($input['date'])) throw new Exception("Date is required");

            // Upsert Override
            // Check if exists
            $check = $pdo->prepare("SELECT id FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
            $check->execute([$instructorId, $input['date']]);
            $exists = $check->fetchColumn();

            if ($exists) {
                $sql = "UPDATE instructor_schedules SET start_time = ?, end_time = ?, is_active = ? WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $input['start'] ?? '09:00',
                    $input['end'] ?? '18:00',
                    $input['active'] ? 1 : 0,
                    $exists
                ]);
            } else {
                // Using UUID()
                $sql = "INSERT INTO instructor_schedules (id, tenant_id, instructor_id, schedule_date, start_time, end_time, is_active) VALUES (UUID(), ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $user['tenant_id'],
                    $instructorId,
                    $input['date'],
                    $input['start'] ?? '09:00',
                    $input['end'] ?? '18:00',
                    $input['active'] ? 1 : 0
                ]);
            }

            echo json_encode(['message' => 'Date overridden successfully']);

        } elseif ($mode === 'weekly') {
            // Save Weekly Template (Full Replacement)
            // Expect: input = [ { day: 1, start: '09:00', end: '18:00', active: true }, ... ]

            // 1. Delete existing template
            $delStmt = $pdo->prepare("DELETE FROM availabilities WHERE instructor_id = ?");
            $delStmt->execute([$instructorId]);

            // 2. Insert new slots
            $insStmt = $pdo->prepare("INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time, is_active) VALUES (UUID(), ?, ?, ?, ?, ?, ?)");

            if (is_array($input)) {
                foreach ($input as $slot) {
                    if (isset($slot['day'])) {
                        $isActive = isset($slot['active']) ? (bool)$slot['active'] : true;
                        // Only insert if active? Or insert as inactive? Schema defaults active=true.
                        // Let's insert only active slots for simplicity, or insert all with is_active flag.
                        // If frontend sends inactive days, we can either skip or insert with is_active=0.
                        // Best practice: insert active ones.

                        if ($isActive) {
                            $insStmt->execute([
                                $user['tenant_id'],
                                $instructorId,
                                $slot['day'],
                                $slot['start'] ?? '09:00',
                                $slot['end'] ?? '18:00',
                                1
                            ]);
                        }
                    }
                }
            }
            echo json_encode(['message' => 'Weekly template updated']);
        } else {
            throw new Exception("Invalid mode");
        }

        $pdo->commit();

    } catch (\Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- GET: Fetch Availability ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // 1. Details for a specific date (Instructor Editor)
    if (isset($_GET['mode']) && $_GET['mode'] === 'details') {
        $date = $_GET['date'] ?? date('Y-m-d');

        $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
        $instStmt->execute([$user['sub']]);
        $instructorId = $instStmt->fetchColumn();

        $schedule = getEffectiveSchedule($pdo, $instructorId, $date);

        // Also fetch the specific row to know if it's an override
        $stmtSpec = $pdo->prepare("SELECT * FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
        $stmtSpec->execute([$instructorId, $date]);
        $override = $stmtSpec->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'effective' => $schedule,
            'is_override' => !!$override,
            'override_data' => $override
        ]);
        exit;
    }

    // 2. Monthly Dots (Student/Instructor Calendar)
    if (isset($_GET['mode']) && $_GET['mode'] === 'month') {
        $instructorId = $_GET['instructorId'] ?? null;
        $month = $_GET['month'] ?? date('m');
        $year = $_GET['year'] ?? date('Y');

        // If instructorId is missing, try to infer from logged-in user if they are an instructor
        if (!$instructorId && $user['role'] === 'instructor') {
             $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
             $instStmt->execute([$user['sub']]);
             $instructorId = $instStmt->fetchColumn();
        }

        if (!$instructorId) { echo json_encode([]); exit; }

        try {
            // Get Weekly Template
            $stmtAvail = $pdo->prepare("SELECT day_of_week FROM availabilities WHERE instructor_id = ? AND is_active = 1");
            $stmtAvail->execute([$instructorId]);
            $weeklyDays = $stmtAvail->fetchAll(PDO::FETCH_COLUMN);

            // Get Specific Overrides
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

    // 3. Weekly Template (for Editor)
    if (isset($_GET['mode']) && $_GET['mode'] === 'weekly') {
        $instructorId = $_GET['instructorId'] ?? null;
        // If not passed, try to infer from user
        if (!$instructorId && $user['role'] === 'instructor') {
             $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
             $instStmt->execute([$user['sub']]);
             $instructorId = $instStmt->fetchColumn();
        }

        if (!$instructorId) { echo json_encode([]); exit; }

        try {
            $stmt = $pdo->prepare("SELECT day_of_week as day, start_time as start, end_time as end, is_active FROM availabilities WHERE instructor_id = ? ORDER BY day_of_week ASC");
            $stmt->execute([$instructorId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Normalize
            $template = [];
            for ($i=0; $i<=6; $i++) {
                $found = false;
                foreach ($rows as $row) {
                    if ((int)$row['day'] === $i) {
                        $template[] = [
                            'day' => $i,
                            'start' => substr($row['start'], 0, 5),
                            'end' => substr($row['end'], 0, 5),
                            'active' => (bool)$row['is_active']
                        ];
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                     $template[] = [
                        'day' => $i,
                        'start' => '09:00',
                        'end' => '18:00',
                        'active' => false
                    ];
                }
            }
            echo json_encode($template);
        } catch (\PDOException $e) {
             http_response_code(500);
             echo json_encode(['error' => $e->getMessage()]);
        }
        exit;
    }

    // 4. Slots (Student View)
    $instructorId = $_GET['instructorId'] ?? null;
    $date = $_GET['date'] ?? null;

    if (!$instructorId || !$date) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing params']);
        exit;
    }

    try {
        $schedule = getEffectiveSchedule($pdo, $instructorId, $date);

        // Check if day is active
        if (!$schedule || !$schedule['is_active']) {
            echo json_encode([]);
            exit;
        }

        $slots = [];
        $startStr = $schedule['start_time'];
        $endStr = $schedule['end_time'];

        $startTs = strtotime("$date $startStr");
        $endTs = strtotime("$date $endStr");

        if (!$startTs || !$endTs || $startTs >= $endTs) {
             echo json_encode([]);
             exit;
        }

        $stmtBooked = $pdo->prepare("SELECT start_time FROM bookings WHERE instructor_id = ? AND booking_date = ? AND status != 'cancelled'");
        $stmtBooked->execute([$instructorId, $date]);
        $bookedTimes = $stmtBooked->fetchAll(PDO::FETCH_COLUMN);

        // Normalize DB times to H:i:00 for comparison
        $bookedTimes = array_map(function($t) { return date('H:i:00', strtotime($t)); }, $bookedTimes);

        while ($startTs < $endTs) {
            // Check if 60 min class fits (Assuming 60 min classes fixed for now)
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
