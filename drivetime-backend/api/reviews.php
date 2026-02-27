<?php
// api/reviews.php
require_once __DIR__ . '/../config.php';

use DriveTime\Database;
use DriveTime\Services\AuthService;

// Auth Check
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

    // GET: List Reviews
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Admins see all, Instructors see theirs, Public? usually via public endpoint or specific logic
        $sql = "SELECT r.*, s.full_name as student_name, i.name as instructor_name
                FROM reviews r
                JOIN users s ON r.student_id = s.id
                JOIN instructors i ON r.instructor_id = i.id
                WHERE r.tenant_id = ?";
        $params = [$user['tenant_id']];

        if ($user['role'] === 'instructor') {
             // Get instructor ID
             $instIdStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
             $instIdStmt->execute([$user['sub']]);
             $instId = $instIdStmt->fetchColumn();
             if ($instId) {
                 $sql .= " AND r.instructor_id = ?";
                 $params[] = $instId;
             }
        }

        $sql .= " ORDER BY r.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll());
    }

    // POST: Submit Review (Student only)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($user['role'] !== 'student') {
            http_response_code(403); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['booking_id']) || empty($input['rating'])) {
            http_response_code(400); echo json_encode(['error'=>'Missing fields']); exit;
        }

        // Verify booking ownership and status
        $bkStmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? AND student_id = ? AND status = 'completed'");
        $bkStmt->execute([$input['booking_id'], $user['sub']]);
        $booking = $bkStmt->fetch();

        if (!$booking) {
             http_response_code(400); echo json_encode(['error'=>'Invalid booking or not completed']); exit;
        }

        // Check if already reviewed
        $chk = $pdo->prepare("SELECT id FROM reviews WHERE booking_id = ?");
        $chk->execute([$input['booking_id']]);
        if ($chk->fetch()) {
            http_response_code(409); echo json_encode(['error'=>'Already reviewed']); exit;
        }

        $id = Database::generateUuid();
        $stmt = $pdo->prepare("INSERT INTO reviews (id, tenant_id, booking_id, student_id, instructor_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $user['tenant_id'],
            $input['booking_id'],
            $user['sub'],
            $booking['instructor_id'],
            $input['rating'],
            $input['comment'] ?? ''
        ]);

        http_response_code(201);
        echo json_encode(['message'=>'Review submitted']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
