<?php
// api/public/search_tenants.php
require_once __DIR__ . '/../../config.php';

use DriveTime\Database;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$query = $_GET['q'] ?? '';

if (strlen($query) < 2) {
    http_response_code(400);
    echo json_encode(['error' => 'Query too short (min 2 chars)']);
    exit;
}

try {
    $pdo = Database::getConnection();

    // Search by name or slug
    $stmt = $pdo->prepare("SELECT id, name, slug FROM tenants WHERE name LIKE ? OR slug LIKE ? LIMIT 10");
    $searchTerm = "%$query%";
    $stmt->execute([$searchTerm, $searchTerm]);
    $results = $stmt->fetchAll();

    echo json_encode($results);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
