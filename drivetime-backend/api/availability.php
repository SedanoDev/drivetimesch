<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Auth Middleware
if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if ($decoded) {
        $user = $decoded;
    }
}

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// --- POST: Save Availability (Instructor) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($user['role'] !== 'instructor') {
        http_response_code(403);
        echo json_encode(['error' => 'Only instructors can set availability']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid format']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
        $instStmt->execute([$user['sub']]);
        $instructorId = $instStmt->fetchColumn();

        if (!$instructorId) {
            // Auto-create instructor profile if missing
            $instructorId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
            $createStmt = $pdo->prepare("INSERT INTO instructors (id, tenant_id, user_id, name) VALUES (?, ?, ?, ?)");
            $createStmt->execute([$instructorId, $user['tenant_id'], $user['sub'], $user['name']]);
        }

        // Clear existing
        $delStmt = $pdo->prepare("DELETE FROM availabilities WHERE instructor_id = ?");
        $delStmt->execute([$instructorId]);

        // Insert new
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

    // Mode: Config (Instructor viewing their own schedule)
    if (isset($_GET['mode']) && $_GET['mode'] === 'config') {
        if ($user['role'] !== 'instructor') { http_response_code(403); exit; }

        try {
            $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
            $instStmt->execute([$user['sub']]);
            $instructorId = $instStmt->fetchColumn();

            if (!$instructorId) { echo json_encode([]); exit; }

            $stmt = $pdo->prepare("SELECT day_of_week as day, start_time as start, end_time as end, is_active as active FROM availabilities WHERE instructor_id = ? ORDER BY day_of_week");
            $stmt->execute([$instructorId]);
            $schedule = $stmt->fetchAll();

            foreach ($schedule as &$s) {
                $s['start'] = substr($s['start'], 0, 5);
                $s['end'] = substr($s['end'], 0, 5);
                $s['active'] = (bool)$s['active'];
            }

            echo json_encode($schedule);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        exit;
    }

    // Mode: Month (Get available days for calendar)
    if (isset($_GET['mode']) && $_GET['mode'] === 'month') {
        $instructorId = $_GET['instructorId'] ?? null;
        $month = $_GET['month'] ?? date('m'); // 1-12
        $year = $_GET['year'] ?? date('Y');

        if (!$instructorId) { echo json_encode([]); exit; }

        try {
            // Get configured days of week (0-6)
            $stmtAvail = $pdo->prepare("SELECT day_of_week FROM availabilities WHERE instructor_id = ? AND is_active = 1");
            $stmtAvail->execute([$instructorId]);
            $availableDaysOfWeek = $stmtAvail->fetchAll(PDO::FETCH_COLUMN);

            if (empty($availableDaysOfWeek)) {
                echo json_encode([]);
                exit;
            }

            // Simple logic: If DOW is configured, check if fully booked?
            // For monthly view, checking full booking status for every day is expensive.
            // Simplified: Return dates where DOW is active.
            // Better: Check bookings count vs capacity?

            // Let's just return dates that match the schedule for now (Green Dots).
            // Frontend calendar will filter past dates.

            $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
            $availableDates = [];

            for ($d = 1; $d <= $daysInMonth; $d++) {
                $dateStr = sprintf("%04d-%02d-%02d", $year, $month, $d);
                $dow = date('w', strtotime($dateStr)); // 0-6

                if (in_array($dow, $availableDaysOfWeek)) {
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
        $dow = date('w', strtotime($date));

        $stmtAvail = $pdo->prepare("SELECT start_time, end_time FROM availabilities WHERE instructor_id = ? AND day_of_week = ? AND is_active = 1");
        $stmtAvail->execute([$instructorId, $dow]);
        $availability = $stmtAvail->fetch();

        if (!$availability) {
            echo json_encode([]);
            exit;
        }

        $slots = [];
        $startStr = $availability['start_time'];
        $endStr = $availability['end_time'];

        $startTs = strtotime("$date $startStr");
        $endTs = strtotime("$date $endStr");

        $stmtBooked = $pdo->prepare("SELECT start_time FROM bookings WHERE instructor_id = ? AND booking_date = ? AND status != 'cancelled'");
        $stmtBooked->execute([$instructorId, $date]);
        $bookedTimes = $stmtBooked->fetchAll(PDO::FETCH_COLUMN);

        $bookedTimes = array_map(function($t) { return date('H:i:00', strtotime($t)); }, $bookedTimes);

        while ($startTs < $endTs) {
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
