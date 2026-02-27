<?php
// api/dashboard.php
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

    // Stats for Dashboard
    $stats = [];

    if ($user['role'] === 'admin' || $user['role'] === 'superadmin') {
        // Total Students
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE tenant_id = ? AND role = 'student'");
        $stmt->execute([$user['tenant_id']]);
        $stats['total_students'] = (int)$stmt->fetchColumn();

        // Total Instructors
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE tenant_id = ? AND role = 'instructor'");
        $stmt->execute([$user['tenant_id']]);
        $stats['total_instructors'] = (int)$stmt->fetchColumn();

        // Pending Bookings
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE tenant_id = ? AND status = 'pending'");
        $stmt->execute([$user['tenant_id']]);
        $stats['pending_bookings'] = (int)$stmt->fetchColumn();

        // Revenue (Mock or based on packs sold)
        $stats['monthly_revenue'] = 0; // Implement if needed
    }
    elseif ($user['role'] === 'instructor') {
         // Get instructor ID
         $instIdStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
         $instIdStmt->execute([$user['sub']]);
         $instId = $instIdStmt->fetchColumn();

         if ($instId) {
             $stmt = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE instructor_id = ? AND status = 'pending'");
             $stmt->execute([$instId]);
             $stats['pending_requests'] = (int)$stmt->fetchColumn();

             $stmt = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE instructor_id = ? AND status = 'confirmed' AND booking_date >= CURDATE()");
             $stmt->execute([$instId]);
             $stats['upcoming_classes'] = (int)$stmt->fetchColumn();
         }
    }
    elseif ($user['role'] === 'student') {
        $stmt = $pdo->prepare("SELECT SUM(remaining_classes) FROM student_packs WHERE student_id = ? AND remaining_classes > 0 AND (expiration_date IS NULL OR expiration_date >= CURDATE())");
        $stmt->execute([$user['sub']]);
        $stats['credits'] = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE student_id = ? AND status = 'confirmed' AND booking_date >= CURDATE()");
        $stmt->execute([$user['sub']]);
        $stats['upcoming_classes'] = (int)$stmt->fetchColumn();
    }

    echo json_encode($stats);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
