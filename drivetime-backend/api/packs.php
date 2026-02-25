<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if ($decoded) $user = $decoded;
}

if (!$user || ($user['role'] !== 'admin' && $user['role'] !== 'superadmin')) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// GET: List Packs
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM class_packs WHERE tenant_id = ?");
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetchAll());
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// POST: Create Pack
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['name'], $input['classes_count'], $input['price'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    try {
        $sql = "INSERT INTO class_packs (id, tenant_id, name, classes_count, price, discount_percentage) VALUES (UUID(), ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $user['tenant_id'],
            $input['name'],
            $input['classes_count'],
            $input['price'],
            $input['discount_percentage'] ?? 0
        ]);
        http_response_code(201);
        echo json_encode(['message' => 'Pack created']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// DELETE: Remove Pack
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) { http_response_code(400); exit; }

    try {
        $stmt = $pdo->prepare("DELETE FROM class_packs WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $user['tenant_id']]);
        echo json_encode(['message' => 'Pack deleted']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
