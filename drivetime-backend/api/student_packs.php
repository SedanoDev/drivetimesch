<?php
// api/student_packs.php
// Start output buffering to capture any unwanted output (warnings, notices, etc.)
ob_start();

// Disable error display to prevent HTML error output in JSON API
ini_set('display_errors', 0);

require_once __DIR__ . '/../config.php';

use DriveTime\Services\AuthService;
use DriveTime\Services\PackService;

// Auth Check
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
} catch (\Throwable $e) {
    ob_clean();
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

$packService = new PackService();

try {
    // GET Credits
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $targetId = $user['sub'];
        if (isset($_GET['student_id']) && ($user['role'] === 'admin' || $user['role'] === 'superadmin')) {
            $targetId = $_GET['student_id'];
        }

        $credits = $packService->getCredits($targetId, $user['tenant_id']);

        // Clean buffer before outputting JSON
        ob_clean();
        echo json_encode(['credits' => $credits]);
    }

    // POST Purchase
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['pack_id'])) throw new Exception("Missing pack_id");

        $packService->purchasePack($user, $input['pack_id'], $input['student_id'] ?? null);

        http_response_code(201);

        // Clean buffer before outputting JSON to remove any warnings/notices
        ob_clean();
        echo json_encode(['message' => 'Pack purchased successfully']);
    }

} catch (\Throwable $e) {
    // Ensure we clean buffer even on error so we send clean JSON error
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
