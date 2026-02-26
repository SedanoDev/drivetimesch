<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if ($decoded) $user = $decoded;
}

if (!$user || ($user['role'] !== 'admin' && $user['role'] !== 'superadmin')) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// GET Settings
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM tenants WHERE id = ?");
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetch());
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// PUT Update Settings
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name required']);
        exit;
    }

    try {
        $sql = "UPDATE tenants SET
            name = ?,
            contact_email = ?,
            contact_phone = ?,
            contact_address = ?,
            primary_color = ?,
            secondary_color = ?,
            class_price = ?,
            class_duration_minutes = ?,
            min_booking_notice_hours = ?,
            min_cancellation_notice_hours = ?,
            min_practice_hours_required = ?,
            welcome_message = ?
            WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $input['name'],
            $input['contact_email'] ?? '',
            $input['contact_phone'] ?? '',
            $input['contact_address'] ?? '',
            $input['primary_color'] ?? '#2563EB',
            $input['secondary_color'] ?? '#1E40AF',
            $input['class_price'] ?? 30.00,
            $input['class_duration_minutes'] ?? 60,
            $input['min_booking_notice_hours'] ?? 24,
            $input['min_cancellation_notice_hours'] ?? 24,
            $input['min_practice_hours_required'] ?? 20,
            $input['welcome_message'] ?? '',
            $user['tenant_id']
        ]);

        http_response_code(200);
        echo json_encode(['message' => 'Settings updated']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
