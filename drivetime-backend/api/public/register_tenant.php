<?php
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate inputs
if (!isset($input['schoolName'], $input['slug'], $input['email'], $input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields']);
    exit;
}

$slug = strtolower(preg_replace('/[^a-z0-9-]/', '', $input['slug']));

try {
    $pdo->beginTransaction();

    // 1. Create Tenant
    $tenantSql = "INSERT INTO tenants (id, name, slug) VALUES (UUID(), ?, ?)";
    $stmtTenant = $pdo->prepare($tenantSql);
    try {
        $stmtTenant->execute([$input['schoolName'], $slug]);
    } catch (\PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate slug
            throw new Exception("La URL '$slug' ya está en uso. Elige otra.");
        }
        throw $e;
    }

    // Get Tenant ID (Need to select it back since it's UUID)
    $tidStmt = $pdo->prepare("SELECT id FROM tenants WHERE slug = ?");
    $tidStmt->execute([$slug]);
    $tenantId = $tidStmt->fetchColumn();

    // 2. Create SuperAdmin User
    $userSql = "INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES (UUID(), ?, ?, ?, ?, 'superadmin')";
    $stmtUser = $pdo->prepare($userSql);
    $stmtUser->execute([
        $tenantId,
        $input['email'],
        password_hash($input['password'], PASSWORD_DEFAULT),
        $input['adminName'] ?? 'Admin'
    ]);

    $pdo->commit();
    http_response_code(201);
    echo json_encode(['message' => 'Tenant registered', 'slug' => $slug]);

} catch (\Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
