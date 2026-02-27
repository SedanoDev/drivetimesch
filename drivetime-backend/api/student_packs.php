<?php
// api/student_packs.php
require_once __DIR__ . '/../config.php';

use DriveTime\Services\AuthService;
use DriveTime\Services\PackService;

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

$packService = new PackService();

try {
    // GET Credits
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $targetId = $user['sub'];
        if (isset($_GET['student_id']) && ($user['role'] === 'admin' || $user['role'] === 'superadmin')) {
            $targetId = $_GET['student_id'];
        }

        $credits = $packService->getCredits($targetId, $user['tenant_id']);
        echo json_encode(['credits' => $credits]);
    }

    // POST Purchase
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['pack_id'])) throw new Exception("Missing pack_id");

        $packService->purchasePack($user, $input['pack_id'], $input['student_id'] ?? null);

        http_response_code(201);
        echo json_encode(['message' => 'Pack purchased successfully']);
    }

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
