<?php
// api/profile.php
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

    // GET Profile
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("SELECT id, email, full_name, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$user['sub']]);
        echo json_encode($stmt->fetch());
    }

    // PUT Update Profile
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);

        $fields = [];
        $params = [];

        if (!empty($input['full_name'])) {
            $fields[] = "full_name = ?";
            $params[] = $input['full_name'];
        }

        if (!empty($input['password'])) {
            $fields[] = "password_hash = ?";
            $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
        }

        if (!empty($fields)) {
            $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
            $params[] = $user['sub'];
            $pdo->prepare($sql)->execute($params);
        }

        echo json_encode(['message'=>'Profile updated']);
    }

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
