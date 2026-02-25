<?php
require_once __DIR__ . '/../../config.php';

// Allow any origin for public search if needed, or rely on config.php CORS
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$query = $_GET['q'] ?? '';

if (strlen($query) < 2) {
    http_response_code(400);
    echo json_encode(['error' => 'Query too short']);
    exit;
}

try {
    // Search by name or slug
    $stmt = $pdo->prepare("SELECT id, name, slug FROM tenants WHERE name LIKE ? OR slug LIKE ? LIMIT 10");
    $searchTerm = "%$query%";
    $stmt->execute([$searchTerm, $searchTerm]);
    $results = $stmt->fetchAll();

    echo json_encode($results);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
