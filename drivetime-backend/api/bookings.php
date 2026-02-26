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
        $pdo->beginTransaction();

        // 3a. Check Credits and Deduct
        // Find the oldest valid pack with credits
        // Using PHP's date() instead of CURDATE() to avoid server time mismatch issues.
        $today = date('Y-m-d');

        $creditStmt = $pdo->prepare("
            SELECT id, remaining_classes
            FROM student_packs
            WHERE student_id = ?
            AND tenant_id = ?
            AND remaining_classes > 0
            AND (expiration_date IS NULL OR expiration_date >= ?)
            ORDER BY created_at ASC, id ASC
            LIMIT 1
            FOR UPDATE
        ");
        $creditStmt->execute([$user['sub'], $user['tenant_id'], $today]);
        $pack = $creditStmt->fetch(PDO::FETCH_ASSOC);

        if (!$pack) {
            $pdo->rollBack();
            http_response_code(402); // Payment Required

            // Log this failure to help debugging if it persists
            error_log("Credit Failure: User={$user['sub']}, Tenant={$user['tenant_id']}, Date={$today}. No valid packs found.");

            echo json_encode(['error' => 'No tienes créditos disponibles. Por favor compra un pack.']);
            exit;
        }

        // Deduct 1 credit
        $deductStmt = $pdo->prepare("UPDATE student_packs SET remaining_classes = remaining_classes - 1 WHERE id = ?");
        $deductStmt->execute([$pack['id']]);


        // 3b. Insert Booking
        // Status is now 'pending' by default, not 'confirmed'
        $stmt = $pdo->prepare("INSERT INTO bookings (id, tenant_id, instructor_id, student_id, student_name, booking_date, start_time, duration_minutes, status) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 'pending')");
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
            $pdo->commit();
            http_response_code(201);
            echo json_encode(['message' => 'Booking request sent successfully']);

            // Send Notification (Mock)
            $stuStmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
            $stuStmt->execute([$user['sub']]);
            $studentEmail = $stuStmt->fetchColumn();

            sendEmail($studentEmail, "Solicitud Enviada", "Has solicitado clase con {$instructor['name']} el {$input['booking_date']} a las {$input['start_time']}. Esperando confirmación.");
        } else {
            $pdo->rollBack();
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

        // Authorization Check for Instructors
        if ($user['role'] === 'instructor') {
            // Find instructor ID for this user
            $instIdStmt = $pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
            $instIdStmt->execute([$user['sub']]);
            $instructorId = $instIdStmt->fetchColumn();

            if (!$instructorId || $booking['instructor_id'] !== $instructorId) {
                http_response_code(403);
                echo json_encode(['error' => 'Unauthorized: You can only modify your own bookings']);
                exit;
            }
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

            $pdo->beginTransaction();

            // Refund Logic: If cancelling a 'confirmed' or 'pending' booking, refund 1 credit
            // We assume 1 booking = 1 credit.
            $needsRefund = ($input['status'] === 'cancelled' || $input['status'] === 'rejected') &&
                           ($booking['status'] === 'confirmed' || $booking['status'] === 'pending');

            if ($needsRefund) {
                // Return credit to the most recently active pack (LIFO-ish to extend validity ideally, or just any valid pack)
                // Let's try to find the pack this student used or just any valid pack to increment.
                // Simplest approach: Increment the most recent valid pack.
                $refundPackStmt = $pdo->prepare("
                    SELECT id
                    FROM student_packs
                    WHERE student_id = ?
                    AND tenant_id = ?
                    AND (expiration_date IS NULL OR expiration_date >= CURDATE())
                    ORDER BY created_at DESC
                    LIMIT 1
                ");
                $refundPackStmt->execute([$booking['student_id'], $user['tenant_id']]); // Use booking's student_id, not necessarily user's (if instructor cancels)
                $targetPack = $refundPackStmt->fetch(PDO::FETCH_ASSOC);

                if ($targetPack) {
                    $pdo->prepare("UPDATE student_packs SET remaining_classes = remaining_classes + 1 WHERE id = ?")->execute([$targetPack['id']]);
                } else {
                    // Corner case: All packs expired? Create a "refund pack" or just fail?
                    // For now, let's create a temporary refund bucket or just log error.
                    // We'll skip complex logic and just not refund if no valid pack exists (rare).
                }
            }

            $stmt = $pdo->prepare("UPDATE bookings SET status = ? WHERE id = ?");
            $stmt->execute([$input['status'], $input['id']]);

            $pdo->commit();
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
