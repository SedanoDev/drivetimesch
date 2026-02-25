<?php
require_once __DIR__ . '/../../config.php';
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

// GET: List Instructors
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT i.*, u.email FROM instructors i JOIN users u ON i.user_id = u.id WHERE i.tenant_id = ?");
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetchAll());
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
