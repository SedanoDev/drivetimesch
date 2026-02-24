<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// ... (Auth Middleware Setup - Same as others) ...
if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if (!$decoded) { http_response_code(401); exit; }
    $user = $decoded;
} else { http_response_code(401); exit; }

// --- POST: Save Availability (Instructor) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($user['role'] !== 'instructor') {
        http_response_code(403);
        echo json_encode(['error' => 'Only instructors can set availability']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    // Expected format: [{ day_of_week: 1, start_time: '09:00', end_time: '18:00', is_active: true }, ...]

    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid format']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Get Instructor ID for this User
        $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
        $instStmt->execute([$user['sub']]);
        $instructorId = $instStmt->fetchColumn();

        if (!$instructorId) {
            throw new Exception("Instructor profile not found");
        }

        // Clear existing availability for this instructor
        $delStmt = $pdo->prepare("DELETE FROM availabilities WHERE instructor_id = ?");
        $delStmt->execute([$instructorId]);

        // Insert new slots
        $insStmt = $pdo->prepare("INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time, is_active) VALUES (UUID(), ?, ?, ?, ?, ?, ?)");

        foreach ($input as $slot) {
            if ($slot['active']) { // Assuming frontend sends 'active' boolean
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
        http_response_code(200);
        echo json_encode(['message' => 'Availability saved']);

    } catch (\Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// ... (GET Logic remains same as previous step, but now fetching from DB) ...
// (We already implemented GET in previous step, so just need to ensure this file handles both methods if merged, or keep separate)
// The previous `availability.php` only handled GET. We should merge or route.
// Let's assume this overwrites and we need to re-add GET.

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // ... Copy GET logic from previous step ...
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
        $start = strtotime($date . ' ' . $availability['start_time']);
        $end = strtotime($date . ' ' . $availability['end_time']);

        $stmtBooked = $pdo->prepare("SELECT start_time FROM bookings WHERE instructor_id = ? AND booking_date = ? AND status != 'cancelled'");
        $stmtBooked->execute([$instructorId, $date]);
        $bookedTimes = $stmtBooked->fetchAll(PDO::FETCH_COLUMN);

        while ($start < $end) {
            $timeStr = date('H:i', $start);
            $dbTimeStr = date('H:i:00', $start);
            $isBooked = in_array($dbTimeStr, $bookedTimes);
            $slots[] = ['time' => $timeStr, 'available' => !$isBooked];
            $start = strtotime('+1 hour', $start);
        }

        echo json_encode($slots);

    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
