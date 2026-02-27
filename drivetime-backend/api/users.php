<?php
// api/users.php
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

if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

try {
    $pdo = Database::getConnection();

    // GET Users
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $sql = "SELECT id, email, full_name, role, created_at FROM users WHERE tenant_id = ?";
        if ($user['role'] !== 'superadmin') {
            $sql .= " AND role != 'superadmin'";
        }
        $sql .= " ORDER BY role, full_name";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetchAll());
    }

    // POST Create User
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['email']) || empty($input['full_name']) || empty($input['role'])) {
            http_response_code(400); echo json_encode(['error'=>'Missing fields']); exit;
        }

        // Check duplicate
        $chk = $pdo->prepare("SELECT id FROM users WHERE tenant_id = ? AND email = ?");
        $chk->execute([$user['tenant_id'], $input['email']]);
        if ($chk->fetch()) {
            http_response_code(409); echo json_encode(['error'=>'Email exists']); exit;
        }

        $pdo->beginTransaction();
        $userId = Database::generateUuid();
        $hash = password_hash('123456', PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $user['tenant_id'], $input['email'], $hash, $input['full_name'], $input['role']]);

        if ($input['role'] === 'instructor') {
            $instId = Database::generateUuid();
            $pdo->prepare("INSERT INTO instructors (id, tenant_id, user_id, name) VALUES (?, ?, ?, ?)")
                ->execute([$instId, $user['tenant_id'], $userId, $input['full_name']]);
        }

        $pdo->commit();
        http_response_code(201);
        echo json_encode(['message'=>'User created']);
    }

    // DELETE User
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id) { http_response_code(400); exit; }
        if ($id === $user['sub']) { http_response_code(400); echo json_encode(['error'=>'Cannot delete self']); exit; }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $user['tenant_id']]);
        echo json_encode(['message'=>'User deleted']);
    }

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
