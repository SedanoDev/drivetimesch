<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Auth Middleware
if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if ($decoded) $user = $decoded;
}

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// --- GET Profile ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT email, full_name, created_at, role FROM users WHERE id = ?");
        $stmt->execute([$user['sub']]);
        $profile = $stmt->fetch();
        
        // Don't send password hash
        echo json_encode($profile);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- PUT Profile ---
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Only allow name and password changes
    $fullName = $input['full_name'] ?? null;
    $password = $input['password'] ?? null;

    if (!$fullName) {
        http_response_code(400);
        echo json_encode(['error' => 'Name required']);
        exit;
    }

    try {
        if ($password && strlen($password) >= 6) {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET full_name = ?, password_hash = ? WHERE id = ?");
            $stmt->execute([$fullName, $hash, $user['sub']]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET full_name = ? WHERE id = ?");
            $stmt->execute([$fullName, $user['sub']]);
        }

        // If instructor, also update instructors table name
        if ($user['role'] === 'instructor') {
             $stmtInst = $pdo->prepare("UPDATE instructors SET name = ? WHERE user_id = ?");
             $stmtInst->execute([$fullName, $user['sub']]);
        }
        
        http_response_code(200);
        echo json_encode(['message' => 'Profile updated']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
