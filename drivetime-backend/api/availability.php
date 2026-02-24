<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Ensure secret key is available
if (!isset($jwt_secret_key)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}

// Auth Middleware
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid Token']);
        exit;
    }
    $user = $decoded;
} else {
    // Availability could be public for unauthenticated users?
    // Usually for SaaS you need at least a tenant context.
    // Let's assume public access needs a tenant_id param,
    // BUT we are using JWT for tenant context.
    // So for now, require login (student account) to see slots.
    http_response_code(401);
    echo json_encode(['error' => 'Token required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$instructorId = $_GET['instructorId'] ?? null;
$date = $_GET['date'] ?? null;

if (!$instructorId || !$date) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing params']);
    exit;
}

try {
    // 1. Get Day of Week (0=Sun, 1=Mon...)
    $dow = date('w', strtotime($date));

    // 2. Get Instructor's Availability for that Day
    $stmtAvail = $pdo->prepare("SELECT start_time, end_time FROM availabilities WHERE instructor_id = ? AND day_of_week = ? AND is_active = 1");
    $stmtAvail->execute([$instructorId, $dow]);
    $availability = $stmtAvail->fetch();

    if (!$availability) {
        echo json_encode([]); // No slots this day
        exit;
    }

    // 3. Generate Potential Slots (Hourly)
    $slots = [];
    $start = strtotime($date . ' ' . $availability['start_time']);
    $end = strtotime($date . ' ' . $availability['end_time']);

    // 4. Get Existing Bookings for that Day
    $stmtBooked = $pdo->prepare("SELECT start_time FROM bookings WHERE instructor_id = ? AND booking_date = ? AND status != 'cancelled'");
    $stmtBooked->execute([$instructorId, $date]);
    $bookedTimes = $stmtBooked->fetchAll(PDO::FETCH_COLUMN); // e.g., ['09:00:00', '10:00:00']

    // 5. Build Slot List
    while ($start < $end) {
        $timeStr = date('H:i', $start); // "09:00"
        $dbTimeStr = date('H:i:00', $start); // "09:00:00" match DB format

        $isBooked = in_array($dbTimeStr, $bookedTimes);

        $slots[] = [
            'time' => $timeStr,
            'available' => !$isBooked
        ];

        $start = strtotime('+1 hour', $start);
    }

    echo json_encode($slots);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
