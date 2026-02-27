<?php
// api/instructors.php
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

    // GET: List Instructors
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("
            SELECT i.id, i.name, i.user_id, u.email,
            (SELECT COUNT(*) FROM reviews r WHERE r.instructor_id = i.id) as review_count,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.instructor_id = i.id) as rating
            FROM instructors i
            JOIN users u ON i.user_id = u.id
            WHERE i.tenant_id = ?
        ");
        $stmt->execute([$user['tenant_id']]);
        $instructors = $stmt->fetchAll();

        // Cast numeric strings to numbers
        foreach ($instructors as &$inst) {
            $inst['rating'] = (float)$inst['rating'];
            $inst['review_count'] = (int)$inst['review_count'];
        }

        echo json_encode($instructors);
    }

    // POST: Create/Update Instructor (Admin only)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403);
            exit;
        }
        // Simplified for brevity, usually handled by users.php for creation
        // But if updating profile:
        $input = json_decode(file_get_contents('php://input'), true);
        // Implementation depends on specific requirements, but basic CRUD here
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
