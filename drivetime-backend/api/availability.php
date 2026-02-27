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
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

try {
    $pdo = Database::getConnection();

    // GET Availability
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $instructorId = $_GET['instructor_id'] ?? null;
        $date = $_GET['date'] ?? null;
        $mode = $_GET['mode'] ?? 'day'; // day | month

        if ($mode === 'month') {
             // Return array of days with available slots in current month
             // Simple logic: assume M-F are working days
             $month = $_GET['month'] ?? date('m');
             $year = $_GET['year'] ?? date('Y');
             // Mock data or complex logic: for now, return simple available days
             // Check DB for blocked days if implemented
             echo json_encode(['available_days' => []]);
        } else {
             // Return slots for a specific date
             if (!$date || !$instructorId) {
                 http_response_code(400); echo json_encode(['error'=>'Missing date or instructor']); exit;
             }

             // Generate slots 9am - 6pm
             $allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00'];

             // Fetch booked slots
             $stmt = $pdo->prepare("SELECT start_time FROM bookings WHERE instructor_id = ? AND booking_date = ? AND status != 'cancelled'");
             $stmt->execute([$instructorId, $date]);
             $booked = $stmt->fetchAll(PDO::FETCH_COLUMN);

             $available = array_values(array_diff($allSlots, $booked));
             echo json_encode($available);
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
