<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/jwt_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email'], $input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing email or password']);
    exit;
}

// Ensure $jwt_secret_key is available from config.php
if (!isset($jwt_secret_key)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}

try {
    // Check user credentials
    // Note: In production, we should also check if tenant is active
    $stmt = $pdo->prepare("SELECT id, tenant_id, password_hash, role, full_name FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch();

    if ($user && password_verify($input['password'], $user['password_hash'])) {

        // Generate Token Payload
        $payload = [
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24), // 24 hours
            'sub' => $user['id'],
            'tenant_id' => $user['tenant_id'],
            'role' => $user['role'],
            'name' => $user['full_name']
        ];

        $token = JWT::encode($payload, $jwt_secret_key);

        echo json_encode([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $input['email'],
                'name' => $user['full_name'],
                'role' => $user['role'],
                'tenant_id' => $user['tenant_id']
            ]
        ]);

    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
