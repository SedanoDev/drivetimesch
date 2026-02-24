<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Ensure secret key is available
if (!isset($jwt_secret_key)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}

// Middleware logic directly here for simplicity (or include auth.php)
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid Token']);
        exit;
    }
    $user = $decoded;
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Token required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    // Filter by Tenant ID from Token
    $stmt = $pdo->prepare("SELECT id, name, bio, vehicle_type, rating, reviews_count, image_url, is_active FROM instructors WHERE is_active = 1 AND tenant_id = ?");
    $stmt->execute([$user['tenant_id']]);
    $instructors = $stmt->fetchAll();
    echo json_encode($instructors);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
