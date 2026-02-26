<?php
// api/public/tenants.php
require_once __DIR__ . '/../../config.php';

use DriveTime\Database;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$slug = $_GET['slug'] ?? null;

if (!$slug) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing slug']);
    exit;
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("SELECT id, name, slug FROM tenants WHERE slug = ?");
    $stmt->execute([$slug]);
    $tenant = $stmt->fetch();

    if ($tenant) {
        echo json_encode($tenant);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Tenant not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
