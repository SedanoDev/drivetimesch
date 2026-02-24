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
    http_response_code(401);
    echo json_encode(['error' => 'Token required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['instructor_id'], $input['booking_date'], $input['start_time'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

try {
    // 1. Verify Instructor belongs to Tenant
    $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE id = ? AND tenant_id = ?");
    $instStmt->execute([$input['instructor_id'], $user['tenant_id']]);
    if ($instStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Instructor not found in this organization']);
        exit;
    }

    // 2. Check Availability (Scoped to Tenant implicitly by instructor_id check)
    $checkStmt = $pdo->prepare("SELECT id FROM bookings WHERE instructor_id = ? AND booking_date = ? AND start_time = ? AND status != 'cancelled'");
    $checkStmt->execute([$input['instructor_id'], $input['booking_date'], $input['start_time']]);

    if ($checkStmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Slot already booked']);
        exit;
    }

    // 3. Create Booking (Scoped to Tenant)
    $stmt = $pdo->prepare("INSERT INTO bookings (id, tenant_id, instructor_id, student_id, student_name, booking_date, start_time, duration_minutes) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)");
    $duration = isset($input['duration_minutes']) ? $input['duration_minutes'] : 60;

    $success = $stmt->execute([
        $user['tenant_id'],
        $input['instructor_id'],
        $user['sub'], // User ID from token
        $user['name'], // Name from token
        $input['booking_date'],
        $input['start_time'],
        $duration
    ]);

    if ($success) {
        http_response_code(201);
        echo json_encode(['message' => 'Booking created successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create booking']);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
