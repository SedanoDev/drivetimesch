<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Disable display errors to prevent JSON corruption
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Auth Middleware
if (!isset($jwt_secret_key)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    // JWT::decode returns associative array (json_decode(..., true))
    if (is_array($decoded)) {
        $user = $decoded;
    } elseif (is_object($decoded)) {
        $user = (array)$decoded;
    }
}

if (!$user || ($user['role'] !== 'admin' && $user['role'] !== 'superadmin')) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// --- GET: List Users ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT id, email, full_name, role, created_at FROM users WHERE tenant_id = ? ORDER BY role, full_name");
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetchAll());
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// --- POST: Create User ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['email']) || empty($input['full_name']) || empty($input['role'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Check duplicate email in this tenant
        $chk = $pdo->prepare("SELECT id FROM users WHERE tenant_id = ? AND email = ?");
        $chk->execute([$user['tenant_id'], $input['email']]);
        if ($chk->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already exists']);
            exit;
        }

        $defaultPass = password_hash('123456', PASSWORD_DEFAULT);
        // Manual UUID v4 generation
        $userId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $sql = "INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $userId,
            $user['tenant_id'],
            $input['email'],
            $defaultPass,
            $input['full_name'],
            $input['role']
        ]);

        // If creating an instructor, create profile too
        if ($input['role'] === 'instructor') {
             $instId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
            $stmtInst = $pdo->prepare("INSERT INTO instructors (id, tenant_id, user_id, name) VALUES (?, ?, ?, ?)");
            $stmtInst->execute([$instId, $user['tenant_id'], $userId, $input['full_name']]);
        }

        $pdo->commit();
        http_response_code(201);
        echo json_encode(['message' => 'User created']);
    } catch (\PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// --- DELETE: Remove User ---
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $userId = $_GET['id'] ?? null;
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing ID']);
        exit;
    }

    if ($userId === $user['sub']) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot delete yourself']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$userId, $user['tenant_id']]);
        if ($stmt->rowCount() > 0) {
            echo json_encode(['message' => 'User deleted']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
        }
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}
