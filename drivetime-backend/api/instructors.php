<?php
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $stmt = $pdo->query("SELECT id, name, bio, vehicle_type, rating, reviews_count, image_url, is_active FROM instructors WHERE is_active = 1");
    $instructors = $stmt->fetchAll();
    echo json_encode($instructors);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
