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
} catch (\Throwable $e) {
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

try {
    $pdo = Database::getConnection();

    // GET: List Instructors
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("
            SELECT i.id, i.name, i.user_id, i.vehicle_type, i.image_url, i.is_active,
            u.email,
            (SELECT COUNT(*) FROM reviews r WHERE r.instructor_id = i.id) as review_count,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.instructor_id = i.id) as rating
            FROM instructors i
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.tenant_id = ?
        ");
        $stmt->execute([$user['tenant_id']]);
        $instructors = $stmt->fetchAll();

        // Cast numeric strings to numbers and boolean
        foreach ($instructors as &$inst) {
            $inst['rating'] = (float)$inst['rating'];
            $inst['review_count'] = (int)$inst['review_count'];
            $inst['is_active'] = (bool)$inst['is_active'];
        }

        echo json_encode($instructors);
    }

    // PUT: Update Instructor (Admin only)
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['id'])) {
             http_response_code(400); echo json_encode(['error'=>'Missing ID']); exit;
        }

        $fields = [];
        $params = [];

        // Toggle Status
        if (isset($input['is_active'])) {
            $fields[] = "is_active = ?";
            $params[] = $input['is_active'] ? 1 : 0;
        }

        // Other fields if needed
        if (isset($input['name'])) {
            $fields[] = "name = ?";
            $params[] = $input['name'];
        }
        if (isset($input['vehicle_type'])) {
            $fields[] = "vehicle_type = ?";
            $params[] = $input['vehicle_type'];
        }

        if (empty($fields)) {
            http_response_code(400); echo json_encode(['error'=>'No fields to update']); exit;
        }

        $sql = "UPDATE instructors SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
        $params[] = $input['id'];
        $params[] = $user['tenant_id'];

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['message' => 'Instructor updated']);
        } else {
            // Check if it exists but wasn't changed
            echo json_encode(['message' => 'No changes made or instructor not found']);
        }
    }

    // POST: Create (usually handled via Users, but keeping placeholder)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // ... (Not implemented fully here as creation is via users.php generally)
        http_response_code(501);
    }

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
