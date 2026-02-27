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

        if (empty($input['name']) || empty($input['classes_count']) || empty($input['price'])) {
             http_response_code(400); echo json_encode(['error'=>'Missing fields']); exit;
        }

        $id = Database::generateUuid();
        // Removed 'description' as it does not exist in schema
        $stmt = $pdo->prepare("INSERT INTO class_packs (id, tenant_id, name, classes_count, price, discount_percentage) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $user['tenant_id'],
            $input['name'],
            $input['classes_count'],
            $input['price'],
            $input['discount_percentage'] ?? 0
        ]);

        http_response_code(201);
        echo json_encode(['message'=>'Pack created']);
    }

    // PUT Update Pack (Admin)
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            http_response_code(400); echo json_encode(['error'=>'Missing ID']); exit;
        }

        $fields = [];
        $params = [];

        if (isset($input['name'])) { $fields[] = "name = ?"; $params[] = $input['name']; }
        if (isset($input['classes_count'])) { $fields[] = "classes_count = ?"; $params[] = $input['classes_count']; }
        if (isset($input['price'])) { $fields[] = "price = ?"; $params[] = $input['price']; }
        if (isset($input['discount_percentage'])) { $fields[] = "discount_percentage = ?"; $params[] = $input['discount_percentage']; }
        if (isset($input['is_active'])) { $fields[] = "is_active = ?"; $params[] = $input['is_active'] ? 1 : 0; }

        if (empty($fields)) {
            http_response_code(400); echo json_encode(['error'=>'No fields to update']); exit;
        }

        $sql = "UPDATE class_packs SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
        $params[] = $input['id'];
        $params[] = $user['tenant_id'];

        $pdo->prepare($sql)->execute($params);
        echo json_encode(['message'=>'Pack updated']);
    }

    // DELETE Pack (Admin)
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $id = $_GET['id'] ?? null;
        if (!$id) { http_response_code(400); exit; }

        $stmt = $pdo->prepare("DELETE FROM class_packs WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $user['tenant_id']]);
        echo json_encode(['message'=>'Pack deleted']);
    }

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
