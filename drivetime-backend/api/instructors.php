<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Disable display errors to prevent JSON corruption
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if (is_array($decoded)) {
        $user = $decoded;
    } elseif (is_object($decoded)) {
        $user = (array)$decoded;
    }
}

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// GET: List Instructors
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT i.*, u.email FROM instructors i JOIN users u ON i.user_id = u.id WHERE i.tenant_id = ?");
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetchAll());
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// PUT: Update Instructor Status/Details
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing ID']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $fields = [];
        $params = [];

        if (isset($input['is_active'])) {
            $fields[] = "is_active = ?";
            $params[] = $input['is_active'] ? 1 : 0;
        }

        if (isset($input['vehicle_id'])) {
            // Unassign from others? Maybe.
            // If empty, set to NULL
            $fields[] = "vehicle_id = ?";
            $params[] = !empty($input['vehicle_id']) ? $input['vehicle_id'] : null;
        }

        if (isset($input['vehicle_type'])) {
            $fields[] = "vehicle_type = ?";
            $params[] = $input['vehicle_type'];
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }

        $params[] = $input['id'];
        $params[] = $user['tenant_id'];

        $sql = "UPDATE instructors SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $pdo->commit();
        http_response_code(200);
        echo json_encode(['message' => 'Instructor updated']);

    } catch (\PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
