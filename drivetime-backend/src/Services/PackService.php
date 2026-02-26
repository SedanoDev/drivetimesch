<?php

namespace DriveTime\Services;

use DriveTime\Database;
use Exception;
use PDO;

class PackService {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getConnection();
    }

    public function getCredits(string $studentId, string $tenantId): int {
        $stmt = $this->pdo->prepare("
            SELECT SUM(remaining_classes) as total
            FROM student_packs
            WHERE student_id = ?
            AND tenant_id = ?
            AND remaining_classes > 0
            AND (expiration_date IS NULL OR expiration_date >= CURDATE())
        ");
        $stmt->execute([$studentId, $tenantId]);
        return (int)$stmt->fetchColumn();
    }

    public function purchasePack(array $user, string $packId, ?string $targetStudentId = null): void {
        // Determine recipient
        $studentId = $user['sub'];
        if (($user['role'] === 'admin' || $user['role'] === 'superadmin') && $targetStudentId) {
            $studentId = $targetStudentId;
        }

        try {
            $this->pdo->beginTransaction();

            // Verify Pack
            $stmt = $this->pdo->prepare("SELECT * FROM class_packs WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$packId, $user['tenant_id']]);
            $pack = $stmt->fetch();

            if (!$pack) {
                throw new Exception("Pack not found", 404);
            }

            // Create Student Pack
            $newId = Database::generateUuid();
            $expirationDate = date('Y-m-d', strtotime('+6 months'));

            $insStmt = $this->pdo->prepare("
                INSERT INTO student_packs
                (id, tenant_id, student_id, pack_id, initial_classes, remaining_classes, expiration_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $insStmt->execute([
                $newId,
                $user['tenant_id'],
                $studentId,
                $pack['id'],
                $pack['classes_count'],
                $pack['classes_count'],
                $expirationDate
            ]);

            $this->pdo->commit();
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
