<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Ensure secret key is available
if (!isset($jwt_secret_key)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}

// Auth Middleware
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::decode($token, $jwt_secret_key);
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid Token']);
        exit;
    }
    $user = $decoded;
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Token required']);
    exit;
}

// Only Admin
if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

try {
    $stats = [];

    // 1. Bookings Today
    $today = date('Y-m-d');
    $stmtToday = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE tenant_id = ? AND booking_date = ?");
    $stmtToday->execute([$user['tenant_id'], $today]);
    $stats['bookings_today'] = $stmtToday->fetchColumn();

    // 2. Pending Bookings
    $stmtPending = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE tenant_id = ? AND status = 'pending'");
    $stmtPending->execute([$user['tenant_id']]);
    $stats['bookings_pending'] = $stmtPending->fetchColumn();

    // 3. Top Instructor (Most Bookings)
    $stmtTop = $pdo->prepare("
        SELECT i.name, COUNT(b.id) as count
        FROM bookings b
        JOIN instructors i ON b.instructor_id = i.id
        WHERE b.tenant_id = ?
        GROUP BY i.id
        ORDER BY count DESC
        LIMIT 1
    ");
    $stmtTop->execute([$user['tenant_id']]);
    $topInstructor = $stmtTop->fetch(PDO::FETCH_ASSOC);
    $stats['top_instructor'] = $topInstructor ? $topInstructor['name'] : 'N/A';

    // 4. Revenue (Total Confirmed Bookings * 25€)
    // Assume 25€ per class for now
    $stmtRev = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE tenant_id = ? AND status = 'confirmed'");
    $stmtRev->execute([$user['tenant_id']]);
    $confirmed = $stmtRev->fetchColumn();
    $stats['total_revenue'] = $confirmed * 25;

    echo json_encode($stats);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
