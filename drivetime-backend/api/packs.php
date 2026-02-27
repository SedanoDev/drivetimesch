<?php
// api/packs.php
require_once __DIR__ . '/../config.php';

use DriveTime\Services\AuthService;
use DriveTime\Services\PackService;

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
    // GET Packs
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $isAdmin = ($user['role'] === 'admin' || $user['role'] === 'superadmin');
        $activeOnly = !$isAdmin;

        $packs = $packService->getAllPacks($user['tenant_id'], $activeOnly);
        echo json_encode($packs);
    }

    // POST Create Pack (Admin)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        $packService->createPack($user['tenant_id'], $input);

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

        $packService->updatePack($user['tenant_id'], $input['id'], $input);
        echo json_encode(['message'=>'Pack updated']);
    }

    // DELETE Pack (Admin)
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $id = $_GET['id'] ?? null;
        if (!$id) { http_response_code(400); exit; }

        $packService->deletePack($user['tenant_id'], $id);
        echo json_encode(['message'=>'Pack deleted']);
    }

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
