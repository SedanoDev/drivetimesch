<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth/jwt_helper.php';
require_once __DIR__ . '/utils/email.php';

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

// --- GET: List Bookings (with filters) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Optimization: Use LEFT JOIN instead of correlated subquery for reviews to prevent N+1 queries
        $sql = "SELECT b.id, b.booking_date, b.start_time, b.status, b.notes, b.student_name, i.name as instructor_name, u.email as student_email,
                CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END as has_review
                FROM bookings b
                LEFT JOIN instructors i ON b.instructor_id = i.id
                LEFT JOIN users u ON b.student_id = u.id
                LEFT JOIN reviews r ON b.id = r.booking_id
                WHERE b.tenant_id = ?";

        $params = [$user['tenant_id']];

        // Filter by Date
        if (isset($_GET['date'])) {
            $sql .= " AND b.booking_date = ?";
            $params[] = $_GET['date'];
        }

        // Filter by Instructor
        if (isset($_GET['instructor_id'])) {
            $sql .= " AND b.instructor_id = ?";
            $params[] = $_GET['instructor_id'];
        }

        // Instructor Role Filter (My Bookings)
        if ($user['role'] === 'instructor') {
             // Find instructor ID for this user
             $instIdStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
             $instIdStmt->execute([$user['sub']]);
             $instructorId = $instIdStmt->fetchColumn();
             if ($instructorId) {
                 $sql .= " AND b.instructor_id = ?";
                 $params[] = $instructorId;
             }
        }

        // Filter by Role (Students only see their own)
        if ($user['role'] === 'student') {
            $sql .= " AND b.student_id = ?";
            $params[] = $user['sub'];
        }

        $sql .= " ORDER BY b.booking_date DESC, b.start_time ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $bookings = $stmt->fetchAll();

        // Boolean conversion
        foreach ($bookings as &$b) {
            $b['has_review'] = (bool)$b['has_review'];
        }

        echo json_encode($bookings);

    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- POST: Create Booking ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['instructor_id'], $input['booking_date'], $input['start_time'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    try {
        // 1. Verify Instructor belongs to Tenant
        $instStmt = $pdo->prepare("SELECT id, name FROM instructors WHERE id = ? AND tenant_id = ?");
        $instStmt->execute([$input['instructor_id'], $user['tenant_id']]);
        $instructor = $instStmt->fetch();

        if (!$instStmt->rowCount()) {
            http_response_code(404);
            echo json_encode(['error' => 'Instructor not found in this organization']);
            exit;
        }

        // 2. Check Availability
        $checkStmt = $pdo->prepare("SELECT id FROM bookings WHERE instructor_id = ? AND booking_date = ? AND start_time = ? AND status != 'cancelled'");
        $checkStmt->execute([$input['instructor_id'], $input['booking_date'], $input['start_time']]);

        if ($checkStmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Slot already booked']);
            exit;
        }

        // 3. Create Booking
        $stmt = $pdo->prepare("INSERT INTO bookings (id, tenant_id, instructor_id, student_id, student_name, booking_date, start_time, duration_minutes) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)");
        $duration = isset($input['duration_minutes']) ? $input['duration_minutes'] : 60;

        $success = $stmt->execute([
            $user['tenant_id'],
            $input['instructor_id'],
            $user['sub'],
            $user['name'],
            $input['booking_date'],
            $input['start_time'],
            $duration
        ]);

        if ($success) {
            http_response_code(201);
            echo json_encode(['message' => 'Booking created successfully']);

            // Send Notification (Mock)
            // Need student email - fetch from DB or token? Token has sub=id.
            $stuStmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
            $stuStmt->execute([$user['sub']]);
            $studentEmail = $stuStmt->fetchColumn();

            sendEmail($studentEmail, "Reserva Confirmada", "Has reservado clase con {$instructor['name']} el {$input['booking_date']} a las {$input['start_time']}.");
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create booking']);
        }

    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- PUT: Update Booking Status/Notes ---
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing ID']);
        exit;
    }

    try {
        $fetchSql = "SELECT * FROM bookings WHERE id = ? AND tenant_id = ?";
        $fetchStmt = $pdo->prepare($fetchSql);
        $fetchStmt->execute([$input['id'], $user['tenant_id']]);
        $booking = $fetchStmt->fetch();

        if (!$booking) {
            http_response_code(404);
            echo json_encode(['error' => 'Booking not found']);
            exit;
        }

        // --- Status Update ---
        if (isset($input['status'])) {
            $allowed_statuses = ['confirmed', 'cancelled', 'pending', 'completed'];
            if (!in_array($input['status'], $allowed_statuses)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid status']);
                exit;
            }

            // Permissions
            if ($user['role'] === 'student') {
                if ($booking['student_id'] !== $user['sub']) { http_response_code(403); exit; }
                if ($input['status'] !== 'cancelled') {
                     http_response_code(403);
                     echo json_encode(['error' => 'Students can only cancel bookings']);
                     exit;
                }
            }

            $stmt = $pdo->prepare("UPDATE bookings SET status = ? WHERE id = ?");
            $stmt->execute([$input['status'], $input['id']]);
        }

        // --- Notes Update ---
        if (isset($input['notes'])) {
            if ($user['role'] === 'student') {
                http_response_code(403);
                echo json_encode(['error' => 'Students cannot edit notes']);
                exit;
            }
            $stmt = $pdo->prepare("UPDATE bookings SET notes = ? WHERE id = ?");
            $stmt->execute([$input['notes'], $input['id']]);
        }

        http_response_code(200);
        echo json_encode(['message' => 'Booking updated']);

    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- DELETE: Hard Delete (Admin Only) ---
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if ($user['role'] !== 'admin' && $user['role'] !== 'superadmin') {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing ID']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$_GET['id'], $user['tenant_id']]);

        http_response_code(200);
        echo json_encode(['message' => 'Booking deleted']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
