<?php
// api/availability.php
require_once __DIR__ . '/../config.php';

use DriveTime\Database;
use DriveTime\Services\AuthService;

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
             // Robust days in month
             $daysInMonth = (int)date('t', strtotime("$year-$month-01"));
             $availableDays = range(1, $daysInMonth); // Todo: filter by actual availability?
             echo json_encode(['available_days' => $availableDays]);
        }
        elseif ($mode === 'weekly') {
            if (!$instructorId) {
                http_response_code(400); echo json_encode(['error'=>'Instructor not identified']); exit;
            }
            // Fetch Standard Weekly Template
            $stmt = $pdo->prepare("SELECT day_of_week, start_time, end_time, is_active FROM availabilities WHERE instructor_id = ?");
            $stmt->execute([$instructorId]);
            echo json_encode($stmt->fetchAll());
        }
        else {
             // Mode: Details (Specific Date Slots for Booking or Editing)
             if (!$date || !$instructorId) {
                 if ($mode === 'details' && !$date) { http_response_code(400); echo json_encode(['error'=>'Missing date']); exit; }
                 if (!$instructorId) { http_response_code(400); echo json_encode(['error'=>'Missing instructor']); exit; }
             }

             // 1. Determine Base Schedule (Start/End) for this date
             $baseStart = '09:00';
             $baseEnd = '18:00';
             $isActive = true;

             // Check specific date override (instructor_schedules)
             $stmtOverride = $pdo->prepare("SELECT * FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
             $stmtOverride->execute([$instructorId, $date]);
             $override = $stmtOverride->fetch();

             if ($override) {
                 // Use override
                 $isActive = (bool)$override['is_active'];
                 $baseStart = substr($override['start_time'], 0, 5); // HH:MM
                 $baseEnd = substr($override['end_time'], 0, 5);
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
                     // No template: default to Standard Hours or Closed?
                     // Let's assume standard 9-18 M-F, closed weekends if no template exists?
                     // Or just default 9-18. User complained "Available every day".
                     // If they set templates for Mon-Fri, Sat/Sun are missing -> Closed.
                     // Logic: If ANY template exists for this instructor, and this day is missing, treat as CLOSED.
                     // If NO templates exist at all, default to 9-18 M-F?

                     $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM availabilities WHERE instructor_id = ?");
                     $stmtCount->execute([$instructorId]);
                     $hasAnyTemplate = $stmtCount->fetchColumn() > 0;

                     if ($hasAnyTemplate) {
                         $isActive = false; // Closed if not defined in template
                     } else {
                         // Default logic if completely unconfigured
                         // M-F 9-18, Sat/Sun Closed
                         $isActive = ($dayOfWeek >= 1 && $dayOfWeek <= 5);
                     }
                 }
             }

             // If specifically requesting details for editing (frontend admin/instructor)
             if ($mode === 'details') {
                 // Return the configuration state (active, start, end)
                 echo json_encode([
                     'is_active' => $isActive,
                     'start_time' => $baseStart,
                     'end_time' => $baseEnd,
                     'override_id' => $override['id'] ?? null // To know if it's an override
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

             // Normalize booked times to HH:MM
             $booked = array_map(function($t) { return substr($t, 0, 5); }, $booked);

             $available = array_values(array_diff($allSlots, $booked));
             echo json_encode($available);
        }
    }

    // POST/PUT: Update Availability
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $mode = $_GET['mode'] ?? 'day';

        $instructorId = $input['instructor_id'] ?? null;
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
                if (!isset($day['day_of_week'])) continue;
                $uuid = Database::generateUuid();
                $isActive = $day['is_active'] ? 1 : 0; // Handle boolean
                $start = $day['start_time'] ?? '09:00';
                $end = $day['end_time'] ?? '18:00';

                $stmtInsert->execute([$uuid, $user['tenant_id'], $instructorId, $day['day_of_week'], $start, $end, $isActive]);
            }
        }
        // Save Specific Day Override
        else {
            $date = $input['date'] ?? null;
            if (!$date) { throw new Exception("Missing date"); }

            $stmtCheck = $pdo->prepare("SELECT id FROM instructor_schedules WHERE instructor_id = ? AND schedule_date = ?");
            $stmtCheck->execute([$instructorId, $date]);
            $existingId = $stmtCheck->fetchColumn();

            $isActive = !empty($input['is_active']) ? 1 : 0;
            $start = $input['start_time'] ?? '09:00';
            $end = $input['end_time'] ?? '18:00';

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
