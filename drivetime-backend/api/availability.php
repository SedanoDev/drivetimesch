<?php
// api/availability.php
require_once __DIR__ . '/../config.php';

use DriveTime\Database;
use DriveTime\Services\AuthService;

// Prevent Caching
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Function to generate slots between start and end time
function generateSlots($start, $end, $duration = 60) {
    $slots = [];
    $current = strtotime($start);
    $endTs = strtotime($end);

    while ($current < $endTs) {
        $slots[] = date('H:i', $current);
        $current = strtotime("+$duration minutes", $current);
    }
    return $slots;
}

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$user = null;

// Allow public access for GET availability (for students booking), but require token for POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
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
} else {
    // For GET, we allow public access (students need to see slots)
    // But if token is present, we can use it to identify context (instructor viewing own)
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        try {
            $authService = new AuthService();
            $user = $authService->validateToken($matches[1]);
        } catch (\Throwable $e) {
            // Ignore invalid token for public GET, just don't have user context
        }
    }
}

try {
    $pdo = Database::getConnection();

    // GET Availability
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $instructorId = $_GET['instructor_id'] ?? $_GET['instructorId'] ?? null;
        $date = $_GET['date'] ?? null;
        $mode = $_GET['mode'] ?? 'day';

        // Auto-detect if user is instructor and ID missing
        if (!$instructorId && $user && $user['role'] === 'instructor') {
            $stmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
            $stmt->execute([$user['sub']]);
            $instructorId = $stmt->fetchColumn();
        }

        if ($mode === 'month') {
             $month = $_GET['month'] ?? date('m');
             $year = $_GET['year'] ?? date('Y');
             $daysInMonth = (int)date('t', strtotime("$year-$month-01"));

             // Check availability for EACH day (Simplified logic for performance)
             // We check if (is active in template AND no override) OR (override exists and is active)

             // 1. Get Template (Map: day_of_week => is_active)
             $stmtTpl = $pdo->prepare("SELECT day_of_week, is_active FROM availabilities WHERE instructor_id = ?");
             $stmtTpl->execute([$instructorId]);
             $template = $stmtTpl->fetchAll(PDO::FETCH_KEY_PAIR); // [day => active]

             // 2. Get Overrides for this month
             $startMonth = "$year-$month-01";
             $endMonth = date('Y-m-t', strtotime($startMonth));
             $stmtOver = $pdo->prepare("SELECT schedule_date, is_active FROM instructor_schedules WHERE instructor_id = ? AND schedule_date BETWEEN ? AND ?");
             $stmtOver->execute([$instructorId, $startMonth, $endMonth]);
             $overrides = $stmtOver->fetchAll(PDO::FETCH_KEY_PAIR); // [date => active]

             $availableDays = [];

             for ($d = 1; $d <= $daysInMonth; $d++) {
                 $currentDate = "$year-$month-" . str_pad($d, 2, '0', STR_PAD_LEFT);
                 $dayOfWeek = date('w', strtotime($currentDate));

                 // Determine availability
                 $isAvailable = false;

                 if (isset($overrides[$currentDate])) {
                     $isAvailable = (bool)$overrides[$currentDate];
                 } elseif (isset($template[$dayOfWeek])) {
                     $isAvailable = (bool)$template[$dayOfWeek];
                 } else {
                     // Default: If any template exists, missing = closed. Else default M-F.
                     if (!empty($template)) {
                         $isAvailable = false;
                     } else {
                         $isAvailable = ($dayOfWeek >= 1 && $dayOfWeek <= 5);
                     }
                 }

                 if ($isAvailable) {
                     $availableDays[] = $d;
                 }
             }

             echo json_encode(['available_days' => $availableDays]);
        }
        elseif ($mode === 'weekly') {
            if (!$instructorId) {
                http_response_code(400); echo json_encode(['error'=>'Instructor not identified']); exit;
            }
            // Fetch Standard Weekly Template ORDER BY DAY
            $stmt = $pdo->prepare("SELECT day_of_week as day, start_time as start, end_time as end, is_active as active FROM availabilities WHERE instructor_id = ? ORDER BY day_of_week ASC");
            $stmt->execute([$instructorId]);
            $results = $stmt->fetchAll();

            // Cast boolean/numbers for frontend compatibility
            foreach ($results as &$row) {
                $row['day'] = (int)$row['day'];
                $row['active'] = (bool)$row['active'];
                $row['start'] = substr($row['start'], 0, 5);
                $row['end'] = substr($row['end'], 0, 5);
            }
            echo json_encode($results);
        }
        else {
             // Mode: Details or Public Slots
             if (!$date || !$instructorId) {
                 if ($mode === 'details' && !$date) { http_response_code(400); echo json_encode(['error'=>'Missing date']); exit; }
                 if (!$instructorId) { http_response_code(400); echo json_encode(['error'=>'Missing instructor']); exit; }
             }

             // 1. Determine Base Schedule
             $baseStart = '09:00';
             $baseEnd = '18:00';
             $isActive = true;
             $isOverride = false;

             // Check specific date override
             $stmtOverride = $pdo->prepare("SELECT * FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
             $stmtOverride->execute([$instructorId, $date]);
             $override = $stmtOverride->fetch();

             if ($override) {
                 $isActive = (bool)$override['is_active'];
                 $baseStart = substr($override['start_time'], 0, 5);
                 $baseEnd = substr($override['end_time'], 0, 5);
                 $isOverride = true;
             } else {
                 // Fallback to Weekly Template
                 $dayOfWeek = date('w', strtotime($date)); // 0 (Sun) - 6 (Sat)
                 $stmtTemplate = $pdo->prepare("SELECT * FROM availabilities WHERE instructor_id = ? AND day_of_week = ?");
                 $stmtTemplate->execute([$instructorId, $dayOfWeek]);
                 $template = $stmtTemplate->fetch();

                 if ($template) {
                     $isActive = (bool)$template['is_active'];
                     $baseStart = substr($template['start_time'], 0, 5);
                     $baseEnd = substr($template['end_time'], 0, 5);
                 } else {
                     $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM availabilities WHERE instructor_id = ?");
                     $stmtCount->execute([$instructorId]);
                     $hasAnyTemplate = $stmtCount->fetchColumn() > 0;

                     if ($hasAnyTemplate) {
                         $isActive = false; // Closed if not in template
                     } else {
                         $isActive = ($dayOfWeek >= 1 && $dayOfWeek <= 5);
                     }
                 }
             }

             // If specifically requesting details for editing (frontend admin/instructor)
             if ($mode === 'details') {
                 // Map to Frontend Expected Structure
                 echo json_encode([
                     'effective' => [
                         'is_active' => $isActive,
                         'start_time' => $baseStart,
                         'end_time' => $baseEnd
                     ],
                     'is_override' => $isOverride
                 ]);
                 exit;
             }

             // Public/Student View: Calculate Slots
             if (!$isActive) {
                 echo json_encode([]); // Closed
                 exit;
             }

             // Generate Base Slots based on Schedule
             $allSlots = generateSlots($baseStart, $baseEnd);

             // Subtract Bookings
             $stmtBooked = $pdo->prepare("SELECT start_time FROM bookings WHERE instructor_id = ? AND booking_date = ? AND status != 'cancelled'");
             $stmtBooked->execute([$instructorId, $date]);
             $booked = $stmtBooked->fetchAll(PDO::FETCH_COLUMN);

             $booked = array_map(function($t) { return substr($t, 0, 5); }, $booked);

             $available = array_values(array_diff($allSlots, $booked));
             echo json_encode($available);
        }
    }

    // POST/PUT: Update Availability
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $mode = $_GET['mode'] ?? 'day';

        // Handle array vs object input for instructor detection
        if (is_array($input) && isset($input[0])) {
             // Array input (Weekly) - check if ANY element has instructor_id or default to user
             $instructorId = null; // Can't easily get from array items if not there
        } else {
             $instructorId = $input['instructor_id'] ?? null;
        }

        if (!$instructorId && $user && $user['role'] === 'instructor') {
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
            $days = $input['days'] ?? $input;

            // Delete existing
            $pdo->prepare("DELETE FROM availabilities WHERE instructor_id = ?")->execute([$instructorId]);

            $stmtInsert = $pdo->prepare("INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");

            foreach ($days as $day) {
                // Map Frontend keys (day, active, start, end) to DB (day_of_week, is_active, start_time, end_time)
                if (!isset($day['day'])) continue;

                $uuid = Database::generateUuid();
                // Check both keys to be safe
                $isActive = ($day['active'] ?? $day['is_active'] ?? false) ? 1 : 0;
                $start = $day['start'] ?? $day['start_time'] ?? '09:00';
                $end = $day['end'] ?? $day['end_time'] ?? '18:00';
                $dayOfWeek = $day['day']; // 0-6

                $stmtInsert->execute([$uuid, $user['tenant_id'], $instructorId, $dayOfWeek, $start, $end, $isActive]);
            }
        }
        // Save Specific Day Override
        else {
            $date = $input['date'] ?? null;
            if (!$date) { throw new Exception("Missing date"); }

            $stmtCheck = $pdo->prepare("SELECT id FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
            $stmtCheck->execute([$instructorId, $date]);
            $existingId = $stmtCheck->fetchColumn();

            // Map Frontend keys (active) to DB (is_active)
            $isActive = ($input['active'] ?? $input['is_active'] ?? false) ? 1 : 0;
            $start = $input['start'] ?? $input['start_time'] ?? '09:00';
            $end = $input['end'] ?? $input['end_time'] ?? '18:00';

            if ($existingId) {
                $pdo->prepare("UPDATE instructor_schedules SET is_active = ?, start_time = ?, end_time = ? WHERE id = ?")
                    ->execute([$isActive, $start, $end, $existingId]);
            } else {
                $uuid = Database::generateUuid();
                $pdo->prepare("INSERT INTO instructor_schedules (id, tenant_id, instructor_id, schedule_date, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)")
                    ->execute([$uuid, $user['tenant_id'], $instructorId, $date, $start, $end, $isActive]);
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
