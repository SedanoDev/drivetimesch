<?php
// api/vehicles.php
require_once __DIR__ . '/../config.php';

use DriveTime\Database;
use DriveTime\Services\AuthService;

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
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

try {
    $pdo = Database::getConnection();

    // GET: List Vehicles
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM vehicles WHERE tenant_id = ?");
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetchAll());
    }

    // POST: Add Vehicle (Admin)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['brand']) || empty($input['model']) || empty($input['plate'])) {
             http_response_code(400); echo json_encode(['error'=>'Missing fields']); exit;
        }

        $id = Database::generateUuid();
        $stmt = $pdo->prepare("INSERT INTO vehicles (id, tenant_id, brand, model, plate, status) VALUES (?, ?, ?, ?, ?, 'active')");
        $stmt->execute([$id, $user['tenant_id'], $input['brand'], $input['model'], $input['plate']]);
        http_response_code(201);
        echo json_encode(['message'=>'Vehicle added']);
    }

    // DELETE: Remove Vehicle
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $id = $_GET['id'] ?? null;
        if (!$id) { http_response_code(400); exit; }

        $stmt = $pdo->prepare("DELETE FROM vehicles WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $user['tenant_id']]);
        echo json_encode(['message'=>'Vehicle deleted']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
