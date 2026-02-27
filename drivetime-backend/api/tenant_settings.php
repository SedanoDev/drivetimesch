<?php
// api/tenant_settings.php
require_once __DIR__ . '/../config.php';

use DriveTime\Database;
use DriveTime\Services\AuthService;

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

try {
    $pdo = Database::getConnection();

    // GET Settings
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM tenants WHERE id = ?");
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetch() ?: []);
    }
    // PUT Settings
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);

        // Allowed fields to update
        $fields = [
            'name', 'logo_url', 'primary_color', 'secondary_color',
            'contact_email', 'contact_phone', 'contact_address',
            'welcome_message', 'class_price', 'class_duration_minutes',
            'min_booking_notice_hours', 'min_cancellation_notice_hours',
            'min_practice_hours_required'
        ];

        $updates = [];
        $params = [];

        foreach ($fields as $f) {
            if (array_key_exists($f, $input)) {
                $updates[] = "$f = ?";
                $params[] = $input[$f];
            }
        }

        if (!empty($updates)) {
            $sql = "UPDATE tenants SET " . implode(', ', $updates) . " WHERE id = ?";
            $params[] = $user['tenant_id'];
            $pdo->prepare($sql)->execute($params);
        }

        echo json_encode(['message'=>'Settings updated']);
    }

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
