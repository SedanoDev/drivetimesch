<?php
// api/public/register_tenant.php
require_once __DIR__ . '/../../config.php';

use DriveTime\Database;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['name']) || empty($input['slug'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields']);
    exit;
}

try {
    $pdo = Database::getConnection();

    // Check availability
    $check = $pdo->prepare("SELECT id FROM tenants WHERE slug = ?");
    $check->execute([$input['slug']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'URL (slug) already taken']);
        exit;
    }

    $id = Database::generateUuid();
    $stmt = $pdo->prepare("INSERT INTO tenants (id, name, slug) VALUES (?, ?, ?)");
    $stmt->execute([$id, $input['name'], $input['slug']]);

    http_response_code(201);
    echo json_encode(['message' => 'School registered successfully', 'slug' => $input['slug']]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
