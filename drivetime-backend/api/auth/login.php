<?php
// api/auth/login.php
require_once __DIR__ . '/../../config.php';

use DriveTime\Services\AuthService;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Support JSON or Form Data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

if (empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing email or password']);
    exit;
}

try {
    $authService = new AuthService();
    $result = $authService->login($input['email'], $input['password'], $input['slug'] ?? null);

    echo json_encode($result);

} catch (Exception $e) {
    if ($e->getMessage() === 'Invalid credentials') {
        http_response_code(401);
    } else {
        http_response_code(500);
    }
    echo json_encode(['error' => $e->getMessage()]);
}
