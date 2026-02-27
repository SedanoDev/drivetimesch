<?php
// api/instructor_students.php
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

    // GET: List Students for Instructor (based on bookings)
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($user['role'] !== 'instructor' && $user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }

        $sql = "SELECT DISTINCT u.id, u.full_name, u.email,
                (SELECT COUNT(*) FROM bookings b WHERE b.student_id = u.id AND b.status = 'completed') as completed_classes
                FROM users u
                JOIN bookings bk ON u.id = bk.student_id
                WHERE bk.tenant_id = ?";

        $params = [$user['tenant_id']];

        if ($user['role'] === 'instructor') {
             $instIdStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
             $instIdStmt->execute([$user['sub']]);
             $instId = $instIdStmt->fetchColumn();
             if ($instId) {
                 $sql .= " AND bk.instructor_id = ?";
                 $params[] = $instId;
             }
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll());
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
