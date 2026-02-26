<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Disable display errors to prevent JSON corruption
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if (is_array($decoded)) {
        $user = $decoded;
    } elseif (is_object($decoded)) {
        $user = (array)$decoded;
    }
}

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// GET: List Reviews for an Instructor
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $instructorId = $_GET['instructor_id'] ?? null;
    if (!$instructorId) {
        http_response_code(400);
        echo json_encode(['error' => 'Instructor ID required']);
        exit;
    }

    try {
        $sql = "
            SELECT r.rating, r.comment, r.created_at, u.full_name as student_name
            FROM reviews r
            JOIN users u ON r.student_id = u.id
            WHERE r.instructor_id = ?
            ORDER BY r.created_at DESC
            LIMIT 50
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$instructorId]);
        echo json_encode($stmt->fetchAll());
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// POST: Create Review
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['booking_id'], $input['rating'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // 1. Verify booking exists and belongs to student
        $stmt = $pdo->prepare("SELECT instructor_id, status FROM bookings WHERE id = ? AND student_id = ?");
        $stmt->execute([$input['booking_id'], $user['sub']]);
        $booking = $stmt->fetch();

        if (!$booking) {
            http_response_code(404);
            echo json_encode(['error' => 'Booking not found or access denied']);
            exit;
        }

        if ($booking['status'] !== 'completed') {
            http_response_code(400);
            echo json_encode(['error' => 'Class must be completed before reviewing']);
            exit;
        }

        // 2. Insert Review
        $sql = "INSERT INTO reviews (id, tenant_id, booking_id, student_id, instructor_id, rating, comment) VALUES (UUID(), ?, ?, ?, ?, ?, ?)";
        $stmtInsert = $pdo->prepare($sql);
        $stmtInsert->execute([
            $user['tenant_id'],
            $input['booking_id'],
            $user['sub'],
            $booking['instructor_id'],
            $input['rating'],
            $input['comment'] ?? ''
        ]);

        // 3. Update Instructor Stats
        $stmtStats = $pdo->prepare("
            UPDATE instructors
            SET
                rating = (SELECT AVG(rating) FROM reviews WHERE instructor_id = ?),
                reviews_count = (SELECT COUNT(*) FROM reviews WHERE instructor_id = ?)
            WHERE id = ?
        ");
        $stmtStats->execute([$booking['instructor_id'], $booking['instructor_id'], $booking['instructor_id']]);

        $pdo->commit();
        http_response_code(201);
        echo json_encode(['message' => 'Review submitted']);

    } catch (\PDOException $e) {
        $pdo->rollBack();
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['error' => 'Review already exists for this booking']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    exit;
}
