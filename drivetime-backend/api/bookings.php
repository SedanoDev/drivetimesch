<?php
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['instructor_id'], $input['student_name'], $input['booking_date'], $input['start_time'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

try {
    // Basic validation: Check if slot is already booked
    $checkStmt = $pdo->prepare("SELECT id FROM bookings WHERE instructor_id = ? AND booking_date = ? AND start_time = ? AND status != 'cancelled'");
    $checkStmt->execute([$input['instructor_id'], $input['booking_date'], $input['start_time']]);

    if ($checkStmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Slot already booked']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO bookings (id, instructor_id, student_name, booking_date, start_time, duration_minutes) VALUES (UUID(), ?, ?, ?, ?, ?)");
    $duration = isset($input['duration_minutes']) ? $input['duration_minutes'] : 60;

    $success = $stmt->execute([
        $input['instructor_id'],
        $input['student_name'],
        $input['booking_date'],
        $input['start_time'],
        $duration
    ]);

    if ($success) {
        http_response_code(201);
        echo json_encode(['message' => 'Booking created successfully', 'id' => $pdo->lastInsertId()]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create booking']);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
