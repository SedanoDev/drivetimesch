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
        $instructorId = $_GET['instructor_id'] ?? $_GET['instructorId'] ?? null; // Handle both cases
        $date = $_GET['date'] ?? null;
        $mode = $_GET['mode'] ?? 'day';

        // Auto-detect instructor ID if user is instructor
        if (!$instructorId && $user['role'] === 'instructor') {
            $stmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
            $stmt->execute([$user['sub']]);
            $instructorId = $stmt->fetchColumn();
        }

        // --- Mode: Month (Overview for calendar dots) ---
        if ($mode === 'month') {
             $month = $_GET['month'] ?? date('m');
             $year = $_GET['year'] ?? date('Y');

             // Use robust calculation for days in month without needing 'calendar' extension
             $daysInMonth = (int)date('t', strtotime("$year-$month-01"));
             $availableDays = range(1, $daysInMonth);

             echo json_encode(['available_days' => $availableDays]);
        }

        // --- Mode: Weekly (For Instructor Dashboard) ---
        elseif ($mode === 'weekly') {
            if (!$instructorId) {
                http_response_code(400); echo json_encode(['error'=>'Instructor not identified']); exit;
            }
            // Return bookings for the week to show in calendar
            // Assuming simplified logic: return bookings for range
            // Frontend probably needs bookings to display
            $start = $_GET['start'] ?? date('Y-m-d');
            $end = $_GET['end'] ?? date('Y-m-d', strtotime('+7 days'));

            $stmt = $pdo->prepare("
                SELECT id, booking_date, start_time, duration_minutes, status, student_name, notes
                FROM bookings
                WHERE instructor_id = ?
                AND booking_date BETWEEN ? AND ?
            ");
            $stmt->execute([$instructorId, $start, $end]);
            $bookings = $stmt->fetchAll();
            echo json_encode($bookings);
        }

        // --- Mode: Details/Day (Specific slots) ---
        else {
             // Return slots for a specific date (mode='details' or default)
             if (!$date || !$instructorId) {
                 // If details requested but missing params, return empty or error
                 if ($mode === 'details' && !$date) {
                     http_response_code(400); echo json_encode(['error'=>'Missing date']); exit;
                 }
                 if (!$instructorId) {
                     http_response_code(400); echo json_encode(['error'=>'Missing instructor']); exit;
                 }
             }

             // Generate standard slots 9am - 6pm
             $allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00'];

             // Fetch booked slots
             $stmt = $pdo->prepare("SELECT start_time FROM bookings WHERE instructor_id = ? AND booking_date = ? AND status != 'cancelled'");
             $stmt->execute([$instructorId, $date]);
             $booked = $stmt->fetchAll(PDO::FETCH_COLUMN);

             // If mode is 'details', maybe return full booking objects?
             // But usually 'details' implies "what's happening this day".
             // If the frontend expects bookings:
             if ($mode === 'details') {
                 $stmtDetails = $pdo->prepare("SELECT * FROM bookings WHERE instructor_id = ? AND booking_date = ?");
                 $stmtDetails->execute([$instructorId, $date]);
                 echo json_encode($stmtDetails->fetchAll());
             } else {
                 // Default: Available slots
                 $available = array_values(array_diff($allSlots, $booked));
                 echo json_encode($available);
             }
        }
    }

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
