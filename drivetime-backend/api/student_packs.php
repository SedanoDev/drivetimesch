<?php
// api/student_packs.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';

// Disable display errors to prevent JSON corruption
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Auth Check
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$user = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    try {
        $decoded = JWT::decode($matches[1], $jwt_secret_key);
        // Cast to array if object
        $user = (array)$decoded;
    } catch (Exception $e) {
        // Invalid token
    }
}

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// GET: Get Total Remaining Credits
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $studentId = $user['sub'];
        // Allow admin/superadmin to check specific student's credits
        if (isset($_GET['student_id']) && ($user['role'] === 'admin' || $user['role'] === 'superadmin')) {
            $studentId = $_GET['student_id'];
        }

        // Calculate sum of remaining classes from all active (non-expired) packs
        $stmt = $pdo->prepare("
            SELECT SUM(remaining_classes) as total_credits
            FROM student_packs
            WHERE student_id = ?
            AND tenant_id = ?
            AND remaining_classes > 0
            AND (expiration_date IS NULL OR expiration_date >= CURDATE())
        ");
        $stmt->execute([$studentId, $user['tenant_id']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        $credits = $result && $result['total_credits'] ? (int)$result['total_credits'] : 0;

        echo json_encode(['credits' => $credits]);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// POST: Buy/Add Pack (Simulated Payment)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $targetStudentId = $user['sub'];

    // If admin is adding, they might specify student_id
    if (($user['role'] === 'admin' || $user['role'] === 'superadmin') && isset($input['student_id'])) {
        $targetStudentId = $input['student_id'];
    } elseif ($user['role'] !== 'student') {
        // Instructors usually don't buy packs, but let's restrict to students/admins just in case
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    if (empty($input['pack_id'])) {
         http_response_code(400);
         echo json_encode(['error' => 'Missing pack_id']);
         exit;
    }

    try {
        // 1. Verify Pack exists
        $stmtPack = $pdo->prepare("SELECT * FROM class_packs WHERE id = ? AND tenant_id = ?");
        $stmtPack->execute([$input['pack_id'], $user['tenant_id']]);
        $pack = $stmtPack->fetch(PDO::FETCH_ASSOC);

        if (!$pack) {
            http_response_code(404);
            echo json_encode(['error' => 'Pack not found']);
            exit;
        }

        // 2. Create Student Pack Record
        // Expiration: 6 months from now
        $expirationDate = date('Y-m-d', strtotime('+6 months'));

        // Manual UUID generation if needed, but assuming DB handles UUID() or we generate it in PHP
        // PHP UUID v4 generator
        $newId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $stmtInsert = $pdo->prepare("
            INSERT INTO student_packs
            (id, tenant_id, student_id, pack_id, initial_classes, remaining_classes, expiration_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $stmtInsert->execute([
            $newId,
            $user['tenant_id'],
            $targetStudentId,
            $pack['id'],
            $pack['classes_count'],
            $pack['classes_count'], // Initial balance = full count
            $expirationDate
        ]);

        http_response_code(201);
        echo json_encode(['message' => 'Pack purchased successfully', 'added_credits' => $pack['classes_count']]);

    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
