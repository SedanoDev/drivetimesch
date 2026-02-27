<?php
// api/availability.php
require_once __DIR__ . '/../config.php';

use DriveTime\Database;
use DriveTime\Services\AuthService;

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$user = null;

try {
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $authService = new AuthService();
        $user = $authService->validateToken($matches[1]);
    } else {
        throw new Exception("Token required");
    }
} catch (\Throwable $e) {
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

try {
    $pdo = Database::getConnection();

    // GET Availability
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $instructorId = $_GET['instructor_id'] ?? $_GET['instructorId'] ?? null;
        $date = $_GET['date'] ?? null;
        $mode = $_GET['mode'] ?? 'day';

        if (!$instructorId && $user['role'] === 'instructor') {
            $stmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
            $stmt->execute([$user['sub']]);
            $instructorId = $stmt->fetchColumn();
        }

        if ($mode === 'month') {
             $month = $_GET['month'] ?? date('m');
             $year = $_GET['year'] ?? date('Y');
             $daysInMonth = (int)date('t', strtotime("$year-$month-01"));
             $availableDays = range(1, $daysInMonth); // Simplified availability
             echo json_encode(['available_days' => $availableDays]);
        }
        elseif ($mode === 'weekly') {
            if (!$instructorId) {
                http_response_code(400); echo json_encode(['error'=>'Instructor not identified']); exit;
            }
            // Fetch Standard Weekly Template from 'availabilities' table
            $stmt = $pdo->prepare("SELECT day_of_week, start_time, end_time, is_active FROM availabilities WHERE instructor_id = ?");
            $stmt->execute([$instructorId]);
            echo json_encode($stmt->fetchAll());
        }
        else {
             if (!$date || !$instructorId) {
                 if ($mode === 'details' && !$date) { http_response_code(400); echo json_encode(['error'=>'Missing date']); exit; }
                 if (!$instructorId) { http_response_code(400); echo json_encode(['error'=>'Missing instructor']); exit; }
             }

             // Details: Show overrides or bookings?
             // If frontend wants to edit slots for a specific day, we should check instructor_schedules overrides first
             if ($mode === 'details') {
                 // Check for specific date override
                 $stmtOverride = $pdo->prepare("SELECT * FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
                 $stmtOverride->execute([$instructorId, $date]);
                 $override = $stmtOverride->fetch();

                 if ($override) {
                     // Return override details
                     echo json_encode($override);
                 } else {
                     // Fallback to weekly template for that day
                     $dayOfWeek = date('w', strtotime($date));
                     // Adjust PHP 0=Sun, 6=Sat to whatever schema uses (0-6 check schema)
                     // Schema says 0=Sunday.
                     $stmtTemplate = $pdo->prepare("SELECT * FROM availabilities WHERE instructor_id = ? AND day_of_week = ?");
                     $stmtTemplate->execute([$instructorId, $dayOfWeek]);
                     $template = $stmtTemplate->fetch();
                     echo json_encode($template ?: ['is_active' => false]); // If no template, assume inactive
                 }
             } else {
                 // Public booking view (slots)
                 $allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00'];
                 $stmt = $pdo->prepare("SELECT start_time FROM bookings WHERE instructor_id = ? AND booking_date = ? AND status != 'cancelled'");
                 $stmt->execute([$instructorId, $date]);
                 $booked = $stmt->fetchAll(PDO::FETCH_COLUMN);
                 $available = array_values(array_diff($allSlots, $booked));
                 echo json_encode($available);
             }
        }
    }

    // POST/PUT: Update Availability
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $mode = $_GET['mode'] ?? 'day';

        $instructorId = $input['instructor_id'] ?? null;
        if (!$instructorId && $user['role'] === 'instructor') {
            $stmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
            $stmt->execute([$user['sub']]);
            $instructorId = $stmt->fetchColumn();
        }
        if (!$instructorId) {
            http_response_code(400); echo json_encode(['error'=>'Missing instructor_id']); exit;
        }

        $pdo->beginTransaction();

        // Save Weekly Template
        if ($mode === 'weekly') {
            // Expecting array of days: [{day_of_week: 1, is_active: true, start_time: '09:00', end_time: '18:00'}, ...]
            $days = $input['days'] ?? $input; // Handle if wrapped or raw array

            // Clear existing template? Or upsert? Upsert is safer to keep IDs if used
            // Simplest: Delete all for instructor and re-insert active ones
            $pdo->prepare("DELETE FROM availabilities WHERE instructor_id = ?")->execute([$instructorId]);

            $stmtInsert = $pdo->prepare("INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");

            foreach ($days as $day) {
                if (!isset($day['day_of_week'])) continue;
                $isActive = $day['is_active'] ?? true;
                if (!$isActive) continue; // Only store active days

                $uuid = Database::generateUuid();
                $start = $day['start_time'] ?? '09:00';
                $end = $day['end_time'] ?? '18:00';

                $stmtInsert->execute([$uuid, $user['tenant_id'], $instructorId, $day['day_of_week'], $start, $end, 1]);
            }
        }
        // Save Specific Day Override
        else {
            // Mode details/day
            $date = $input['date'] ?? null;
            if (!$date) { throw new Exception("Missing date"); }

            // Upsert into instructor_schedules
            // Check existence
            $stmtCheck = $pdo->prepare("SELECT id FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
            $stmtCheck->execute([$instructorId, $date]);
            $existingId = $stmtCheck->fetchColumn();

            $isActive = $input['is_active'] ?? true;
            $start = $input['start_time'] ?? '09:00';
            $end = $input['end_time'] ?? '18:00';

            if ($existingId) {
                $pdo->prepare("UPDATE instructor_schedules SET is_active = ?, start_time = ?, end_time = ? WHERE id = ?")
                    ->execute([$isActive ? 1 : 0, $start, $end, $existingId]);
            } else {
                $uuid = Database::generateUuid();
                $pdo->prepare("INSERT INTO instructor_schedules (id, tenant_id, instructor_id, schedule_date, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)")
                    ->execute([$uuid, $user['tenant_id'], $instructorId, $date, $start, $end, $isActive ? 1 : 0]);
            }
        }

        $pdo->commit();
        echo json_encode(['message' => 'Availability saved']);
    }

} catch (\Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
