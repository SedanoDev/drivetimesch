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
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

try {
    $pdo = Database::getConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM tenants WHERE id = ?");
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetch() ?: []);
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);

        // Dynamic update based on input keys (safe for settings)
        // For simplicity, just update common fields
        $fields = ['name', 'logo_url', 'primary_color', 'secondary_color', 'contact_email', 'contact_phone', 'address'];
        $updates = [];
        $params = [];

        foreach ($fields as $f) {
            if (isset($input[$f])) {
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

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
