<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Auth Middleware
if (!isset($jwt_secret_key)) { http_response_code(500); exit; }
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if ($decoded) $user = $decoded;
}

if (!$user || $user['role'] !== 'instructor') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// --- GET: List Students ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // First get instructor ID
        $instStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
        $instStmt->execute([$user['sub']]);
        $instructorId = $instStmt->fetchColumn();

        if (!$instructorId) {
            echo json_encode([]);
            exit;
        }

        // Fetch students - FIX: Use subquery or GROUP BY to handle aggregate
        // The previous query might fail on strict SQL mode if not grouped properly
        $sql = "
            SELECT 
                u.id, 
                u.full_name, 
                u.email, 
                COUNT(b.id) as total_classes,
                MAX(b.booking_date) as last_class
            FROM bookings b
            JOIN users u ON b.student_id = u.id
            WHERE b.instructor_id = ?
            GROUP BY u.id, u.full_name, u.email
            ORDER BY last_class DESC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$instructorId]);
        echo json_encode($stmt->fetchAll());
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
