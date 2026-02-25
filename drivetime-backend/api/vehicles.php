<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Auth Middleware
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

// --- GET: List Vehicles ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $sql = "
            SELECT v.*, i.name as instructor_name
            FROM vehicles v
            LEFT JOIN instructors i ON v.id = i.vehicle_id
            WHERE v.tenant_id = ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetchAll());
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- POST: Create Vehicle ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['make'], $input['model'], $input['plate'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    try {
        $sql = "INSERT INTO vehicles (id, tenant_id, make, model, plate, status) VALUES (UUID(), ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $user['tenant_id'],
            $input['make'],
            $input['model'],
            $input['plate'],
            $input['status'] ?? 'active'
        ]);

        http_response_code(201);
        echo json_encode(['message' => 'Vehicle created']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- DELETE: Remove Vehicle ---
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM vehicles WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $user['tenant_id']]);
        echo json_encode(['message' => 'Vehicle deleted']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
