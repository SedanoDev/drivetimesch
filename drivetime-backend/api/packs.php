<?php
// api/packs.php
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
} catch (\Throwable $e) {
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

try {
    $pdo = Database::getConnection();

    // GET Packs
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM class_packs WHERE tenant_id = ? AND is_active = 1 ORDER BY price ASC");
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetchAll());
    }

    // POST Create Pack (Admin)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);

        $id = Database::generateUuid();
        $stmt = $pdo->prepare("INSERT INTO class_packs (id, tenant_id, name, classes_count, price, description) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $user['tenant_id'],
            $input['name'],
            $input['classes_count'],
            $input['price'],
            $input['description'] ?? ''
        ]);

        http_response_code(201);
        echo json_encode(['message'=>'Pack created']);
    }

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
