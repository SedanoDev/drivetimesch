<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Ensure secret key is available
if (!isset($jwt_secret_key)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}

// Auth Middleware
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

// --- GET: List All Instructors ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $sql = "SELECT i.*, u.email
                FROM instructors i
                LEFT JOIN users u ON i.user_id = u.id
                WHERE i.tenant_id = ?";

        // If not admin, maybe filter inactive?
        if ($user['role'] === 'student') {
            $sql .= " AND i.is_active = 1";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user['tenant_id']]);
        $instructors = $stmt->fetchAll();

        echo json_encode($instructors);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- POST: Create Instructor (Admin) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    // Required fields
    if (!isset($input['name'], $input['vehicle_type'], $input['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // 1. Create User for Instructor
        $userSql = "INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES (UUID(), ?, ?, ?, ?, 'instructor')";
        // Default password for now
        $defaultPass = password_hash('instructor123', PASSWORD_DEFAULT);

        $stmtUser = $pdo->prepare($userSql);
        $stmtUser->execute([$user['tenant_id'], $input['email'], $defaultPass, $input['name']]);

        // Get inserted User ID
        // Since we insert UUID(), we can't get it via lastInsertId easily unless we generated it in PHP or select it back.
        // Let's select it back by email/tenant
        $uidStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND tenant_id = ?");
        $uidStmt->execute([$input['email'], $user['tenant_id']]);
        $userId = $uidStmt->fetchColumn();

        // 2. Create Instructor Profile
        $instSql = "INSERT INTO instructors (id, tenant_id, user_id, name, bio, vehicle_type, image_url) VALUES (UUID(), ?, ?, ?, ?, ?, ?)";
        $stmtInst = $pdo->prepare($instSql);
        $stmtInst->execute([
            $user['tenant_id'],
            $userId,
            $input['name'],
            $input['bio'] ?? '',
            $input['vehicle_type'],
            $input['image_url'] ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=' . urlencode($input['name'])
        ]);

        $pdo->commit();
        http_response_code(201);
        echo json_encode(['message' => 'Instructor created', 'user_id' => $userId]);

    } catch (\Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- PUT: Update Instructor (Admin) ---
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
         // Maybe instructor can update their own bio? Not for now.
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing ID']);
        exit;
    }

    try {
        $sql = "UPDATE instructors SET name = ?, bio = ?, vehicle_type = ?, is_active = ? WHERE id = ? AND tenant_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $input['name'],
            $input['bio'],
            $input['vehicle_type'],
            isset($input['is_active']) ? (int)$input['is_active'] : 1,
            $input['id'],
            $user['tenant_id']
        ]);

        http_response_code(200);
        echo json_encode(['message' => 'Instructor updated']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
