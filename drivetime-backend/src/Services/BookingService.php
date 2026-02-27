<?php

namespace DriveTime\Services;

use DriveTime\Database;
use Exception;
use PDO;

class BookingService {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getConnection();
    }

    public function getBookings(array $user, array $filters = []): array {
        $sql = "SELECT b.id, b.booking_date, b.start_time, b.status, b.notes, b.student_name, i.name as instructor_name, u.email as student_email,
                CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END as has_review
                FROM bookings b
                LEFT JOIN instructors i ON b.instructor_id = i.id
                LEFT JOIN users u ON b.student_id = u.id
                LEFT JOIN reviews r ON b.id = r.booking_id
                WHERE b.tenant_id = ?";

        $params = [$user['tenant_id']];

        if (!empty($filters['date'])) {
            $sql .= " AND b.booking_date = ?";
            $params[] = $filters['date'];
        }

        if (!empty($filters['instructor_id'])) {
            $sql .= " AND b.instructor_id = ?";
            $params[] = $filters['instructor_id'];
        }

        // Role-based filtering
        if ($user['role'] === 'instructor') {
            $instIdStmt = $this->pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
            $instIdStmt->execute([$user['sub']]);
            $instructorId = $instIdStmt->fetchColumn();

            if ($instructorId) {
                $sql .= " AND b.instructor_id = ?";
                $params[] = $instructorId;
            }
        } elseif ($user['role'] === 'student') {
            $sql .= " AND b.student_id = ?";
            $params[] = $user['sub'];
        }

        $sql .= " ORDER BY b.booking_date DESC, b.start_time ASC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $bookings = $stmt->fetchAll();

        // Convert boolean
        foreach ($bookings as &$b) {
            $b['has_review'] = (bool)$b['has_review'];
        }

        return $bookings;
    }

    public function createBooking(array $user, array $data): void {
        // Handle aliases for compatibility (e.g. external API usage)
        if (!isset($data['booking_date']) && isset($data['date'])) {
            $data['booking_date'] = $data['date'];
        }
        if (!isset($data['start_time']) && isset($data['time_slot'])) {
            $data['start_time'] = $data['time_slot'];
        }

        // Detailed validation
        $missing = [];
        if (empty($data['instructor_id'])) $missing[] = 'instructor_id';
        if (empty($data['booking_date'])) $missing[] = 'booking_date';
        if (empty($data['start_time'])) $missing[] = 'start_time';

        if (!empty($missing)) {
            throw new Exception("Missing required fields: " . implode(', ', $missing), 400);
        }

        try {
            $this->pdo->beginTransaction();

            // 1. Verify Instructor
            $instStmt = $this->pdo->prepare("SELECT id, name FROM instructors WHERE id = ? AND tenant_id = ?");
            $instStmt->execute([$data['instructor_id'], $user['tenant_id']]);
            if (!$instStmt->fetch()) {
                throw new Exception("Instructor not found", 404);
            }

            // 2. Check Availability
            $checkStmt = $this->pdo->prepare("SELECT id FROM bookings WHERE instructor_id = ? AND booking_date = ? AND start_time = ? AND status != 'cancelled'");
            $checkStmt->execute([$data['instructor_id'], $data['booking_date'], $data['start_time']]);
            if ($checkStmt->fetch()) {
                throw new Exception("Slot already booked", 409);
            }

            // 3. Deduct Credit (Lock Row)
            // Use CURDATE() to align with PackService check and avoid timezone mismatches
            $creditStmt = $this->pdo->prepare("
                SELECT id
                FROM student_packs
                WHERE student_id = ?
                AND tenant_id = ?
                AND remaining_classes > 0
                AND (expiration_date IS NULL OR expiration_date >= CURDATE())
                ORDER BY purchase_date ASC, id ASC
                LIMIT 1
                FOR UPDATE
            ");
            $creditStmt->execute([$user['sub'], $user['tenant_id']]);
            $pack = $creditStmt->fetch();

            if (!$pack) {
                // Log detailed error for debugging
                error_log("Booking Failed: No valid credits found for User {$user['sub']} Tenant {$user['tenant_id']}");
                throw new Exception("No tienes créditos válidos disponibles.", 402);
            }

            $deductStmt = $this->pdo->prepare("UPDATE student_packs SET remaining_classes = remaining_classes - 1 WHERE id = ?");
            $deductStmt->execute([$pack['id']]);

            // 4. Insert Booking
            $bookingId = Database::generateUuid();
            $stmt = $this->pdo->prepare("
                INSERT INTO bookings (id, tenant_id, instructor_id, student_id, student_name, booking_date, start_time, duration_minutes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            ");

            $stmt->execute([
                $bookingId,
                $user['tenant_id'],
                $data['instructor_id'],
                $user['sub'],
                $user['name'],
                $data['booking_date'],
                $data['start_time'],
                $data['duration_minutes'] ?? 60
            ]);

            $this->pdo->commit();

            // Send Email (Async/Best Effort) could go here

        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    public function updateBooking(array $user, string $bookingId, array $data): void {
        // Fetch Booking
        $stmt = $this->pdo->prepare("SELECT * FROM bookings WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$bookingId, $user['tenant_id']]);
        $booking = $stmt->fetch();

        if (!$booking) {
            throw new Exception("Booking not found", 404);
        }

        // Permissions Check
        if ($user['role'] === 'instructor') {
            $instStmt = $this->pdo->prepare("SELECT id FROM instructors WHERE user_id = ?");
            $instStmt->execute([$user['sub']]);
            $instId = $instStmt->fetchColumn();
            if ($booking['instructor_id'] !== $instId) {
                throw new Exception("Unauthorized", 403);
            }
        } elseif ($user['role'] === 'student') {
            if ($booking['student_id'] !== $user['sub']) {
                throw new Exception("Unauthorized", 403);
            }
            if (isset($data['status']) && $data['status'] !== 'cancelled') {
                throw new Exception("Students can only cancel", 403);
            }
            if (isset($data['notes'])) {
                throw new Exception("Students cannot edit notes", 403);
            }
        }

        try {
            $this->pdo->beginTransaction();

            if (isset($data['status'])) {
                // Refund logic
                $needsRefund = ($data['status'] === 'cancelled' || $data['status'] === 'rejected') &&
                               ($booking['status'] === 'confirmed' || $booking['status'] === 'pending');

                if ($needsRefund) {
                    $refundStmt = $this->pdo->prepare("
                        SELECT id FROM student_packs
                        WHERE student_id = ? AND tenant_id = ?
                        ORDER BY purchase_date DESC LIMIT 1
                    ");
                    $refundStmt->execute([$booking['student_id'], $user['tenant_id']]);
                    $pack = $refundStmt->fetch();
                    if ($pack) {
                        $this->pdo->prepare("UPDATE student_packs SET remaining_classes = remaining_classes + 1 WHERE id = ?")
                                  ->execute([$pack['id']]);
                    }
                }

                $updStmt = $this->pdo->prepare("UPDATE bookings SET status = ? WHERE id = ?");
                $updStmt->execute([$data['status'], $bookingId]);
            }

            if (isset($data['notes'])) {
                $updStmt = $this->pdo->prepare("UPDATE bookings SET notes = ? WHERE id = ?");
                $updStmt->execute([$data['notes'], $bookingId]);
            }

            $this->pdo->commit();
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
