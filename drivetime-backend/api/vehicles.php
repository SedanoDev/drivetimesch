<?php
// api/vehicles.php
require_once __DIR__ . '/../config.php';

use DriveTime\Database;
use DriveTime\Services\AuthService;

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
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

try {
    $pdo = Database::getConnection();

    // GET: List Vehicles
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("
            SELECT v.*, i.name as instructor_name, i.id as instructor_id
            FROM vehicles v
            LEFT JOIN instructors i ON v.instructor_id = i.id
            WHERE v.tenant_id = ?
        ");
        $stmt->execute([$user['tenant_id']]);
        echo json_encode($stmt->fetchAll());
    }

    // POST: Add Vehicle (Admin)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['make']) || empty($input['model']) || empty($input['plate'])) {
             // Backward compatibility if frontend sends 'brand' instead of 'make'
             $make = $input['make'] ?? $input['brand'] ?? null;
             if (!$make) { http_response_code(400); echo json_encode(['error'=>'Missing make/brand']); exit; }
             $input['make'] = $make;
        }

        $id = Database::generateUuid();
        $stmt = $pdo->prepare("INSERT INTO vehicles (id, tenant_id, make, model, plate, status, instructor_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $status = $input['status'] ?? 'active';
        $instructorId = !empty($input['instructor_id']) ? $input['instructor_id'] : null;

        $stmt->execute([$id, $user['tenant_id'], $input['make'], $input['model'], $input['plate'], $status, $instructorId]);

        // If assigned to instructor, update instructor table too (bidirectional sync)
        if ($instructorId) {
            $pdo->prepare("UPDATE instructors SET vehicle_id = ? WHERE id = ?")->execute([$id, $instructorId]);
        }

        http_response_code(201);
        echo json_encode(['message'=>'Vehicle added']);
    }

    // PUT: Update Vehicle
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            http_response_code(400); echo json_encode(['error'=>'Missing ID']); exit;
        }

        $fields = [];
        $params = [];

        if (isset($input['make'])) { $fields[] = "make = ?"; $params[] = $input['make']; }
        if (isset($input['brand'])) { $fields[] = "make = ?"; $params[] = $input['brand']; } // Alias
        if (isset($input['model'])) { $fields[] = "model = ?"; $params[] = $input['model']; }
        if (isset($input['plate'])) { $fields[] = "plate = ?"; $params[] = $input['plate']; }
        if (isset($input['status'])) { $fields[] = "status = ?"; $params[] = $input['status']; }

        // Handle Instructor Assignment
        if (array_key_exists('instructor_id', $input)) {
            $fields[] = "instructor_id = ?";
            $newInstructorId = !empty($input['instructor_id']) ? $input['instructor_id'] : null;
            $params[] = $newInstructorId;

            // Sync with instructors table
            // 1. Clear previous assignment for this vehicle
            $pdo->prepare("UPDATE instructors SET vehicle_id = NULL WHERE vehicle_id = ?")->execute([$input['id']]);

            // 2. Set new assignment if applicable
            if ($newInstructorId) {
                $pdo->prepare("UPDATE instructors SET vehicle_id = ? WHERE id = ?")->execute([$input['id'], $newInstructorId]);
            }
        }

        if (empty($fields)) {
            http_response_code(400); echo json_encode(['error'=>'No fields to update']); exit;
        }

        $sql = "UPDATE vehicles SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
        $params[] = $input['id'];
        $params[] = $user['tenant_id'];

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['message'=>'Vehicle updated']);
    }

    // DELETE: Remove Vehicle
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
            http_response_code(403); exit;
        }
        $id = $_GET['id'] ?? null;
        if (!$id) { http_response_code(400); exit; }

        $stmt = $pdo->prepare("DELETE FROM vehicles WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $user['tenant_id']]);
        echo json_encode(['message'=>'Vehicle deleted']);
    }

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
