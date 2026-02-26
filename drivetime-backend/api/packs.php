<?php
// api/packs.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Disable display errors to prevent JSON corruption
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Auth Check
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    try {
        $decoded = JWT::decode($matches[1], $jwt_secret_key);
        $user = (array)$decoded;
    } catch (Exception $e) {
        // Invalid token
    }
}

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// GET: List Packs (Available to ALL roles)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM class_packs WHERE tenant_id = ? ORDER BY price ASC");
        $stmt->execute([$user['tenant_id']]);
        $packs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($packs);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Admin Check for Write Operations
if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Admins only']);
    exit;
}

// POST: Create Pack
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validation
    if (empty($input['name']) || empty($input['classes_count']) || empty($input['price'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    try {
        // Using UUID() for ID generation if MySQL 8+, otherwise PHP should generate it.
        // Assuming database has UUID default or we generate it. Let's use PHP to be safe or UUID() if supported.
        // The original code used UUID(), so I'll stick to it.
        $stmt = $pdo->prepare("INSERT INTO class_packs (id, tenant_id, name, classes_count, price, discount_percentage) VALUES (UUID(), ?, ?, ?, ?, ?)");
        $stmt->execute([
            $user['tenant_id'],
            $input['name'],
            $input['classes_count'],
            $input['price'],
            $input['discount_percentage'] ?? 0
        ]);

        http_response_code(201);
        echo json_encode(['message' => 'Pack created successfully']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// DELETE: Remove Pack
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing ID']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM class_packs WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $user['tenant_id']]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['message' => 'Pack deleted']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Pack not found']);
        }
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
