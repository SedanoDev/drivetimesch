<?php
// api/reviews.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Disable display errors
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    try {
        $decoded = JWT::decode($matches[1], $jwt_secret_key);
        $user = (array)$decoded;
    } catch (Exception $e) { }
}

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// GET: List Reviews
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // If Instructor ID provided, list for that instructor (Public/Student view)
        if (isset($_GET['instructor_id'])) {
            $sql = "
                SELECT r.id, r.rating, r.comment, r.created_at, u.full_name as student_name
                FROM reviews r
                JOIN users u ON r.student_id = u.id
                WHERE r.instructor_id = ?
                ORDER BY r.created_at DESC
                LIMIT 50
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_GET['instructor_id']]);
            echo json_encode($stmt->fetchAll());
            exit;
        }

        // If Admin, list ALL reviews for Tenant
        if ($user['role'] === 'admin' || $user['role'] === 'superadmin') {
            $sql = "
                SELECT r.id, r.rating, r.comment, r.created_at, u.full_name as student_name, i.name as instructor_name
                FROM reviews r
                JOIN users u ON r.student_id = u.id
                JOIN instructors i ON r.instructor_id = i.id
                WHERE r.tenant_id = ?
                ORDER BY r.created_at DESC
                LIMIT 100
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user['tenant_id']]);
            echo json_encode($stmt->fetchAll());
            exit;
        }

        http_response_code(400);
        echo json_encode(['error' => 'Missing filters or permission']);

    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// POST: Create Review (Student Only)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($user['role'] !== 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Only students can review']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['booking_id'], $input['rating'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // 1. Verify booking
        $stmt = $pdo->prepare("SELECT instructor_id, status FROM bookings WHERE id = ? AND student_id = ?");
        $stmt->execute([$input['booking_id'], $user['sub']]);
        $booking = $stmt->fetch();

        if (!$booking) {
            http_response_code(404);
            echo json_encode(['error' => 'Booking not found']);
            exit;
        }

        if ($booking['status'] !== 'completed') {
            http_response_code(400);
            echo json_encode(['error' => 'Class must be completed first']);
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
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// DELETE: Remove Review (Admin Only)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $id = $_GET['id'] ?? null;
    if (!$id) { http_response_code(400); exit; }

    try {
        // Need instructor_id to update stats after delete
        $stmtGet = $pdo->prepare("SELECT instructor_id FROM reviews WHERE id = ? AND tenant_id = ?");
        $stmtGet->execute([$id, $user['tenant_id']]);
        $review = $stmtGet->fetch();

        if (!$review) {
            http_response_code(404);
            echo json_encode(['error' => 'Review not found']);
            exit;
        }

        $pdo->beginTransaction();

        // 1. Delete
        $stmt = $pdo->prepare("DELETE FROM reviews WHERE id = ?");
        $stmt->execute([$id]);

        // 2. Update Stats
        $stmtStats = $pdo->prepare("
            UPDATE instructors
            SET
                rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE instructor_id = ?), 5.0),
                reviews_count = (SELECT COUNT(*) FROM reviews WHERE instructor_id = ?)
            WHERE id = ?
        ");
        $stmtStats->execute([$review['instructor_id'], $review['instructor_id'], $review['instructor_id']]);

        $pdo->commit();
        echo json_encode(['message' => 'Review deleted']);

    } catch (\PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
