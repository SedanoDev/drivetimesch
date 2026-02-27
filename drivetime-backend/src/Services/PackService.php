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

    public function getAllPacks(string $tenantId, bool $activeOnly = true): array {
        $sql = "SELECT * FROM class_packs WHERE tenant_id = ?";
        if ($activeOnly) {
            $sql .= " AND is_active = 1";
        }
        $sql .= " ORDER BY price ASC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$tenantId]);
        return $stmt->fetchAll();
    }

    public function createPack(string $tenantId, array $data): void {
        if (empty($data['name']) || empty($data['classes_count']) || empty($data['price'])) {
             throw new Exception("Missing fields", 400);
        }

        $id = Database::generateUuid();
        $stmt = $this->pdo->prepare("INSERT INTO class_packs (id, tenant_id, name, classes_count, price, discount_percentage) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $tenantId,
            $data['name'],
            $data['classes_count'],
            $data['price'],
            $data['discount_percentage'] ?? 0
        ]);
    }

    public function updatePack(string $tenantId, string $packId, array $data): void {
        $fields = [];
        $params = [];

        if (isset($data['name'])) { $fields[] = "name = ?"; $params[] = $data['name']; }
        if (isset($data['classes_count'])) { $fields[] = "classes_count = ?"; $params[] = $data['classes_count']; }
        if (isset($data['price'])) { $fields[] = "price = ?"; $params[] = $data['price']; }
        if (isset($data['discount_percentage'])) { $fields[] = "discount_percentage = ?"; $params[] = $data['discount_percentage']; }
        if (isset($data['is_active'])) { $fields[] = "is_active = ?"; $params[] = $data['is_active'] ? 1 : 0; }

        if (empty($fields)) {
            throw new Exception("No fields to update", 400);
        }

        $sql = "UPDATE class_packs SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
        $params[] = $packId;
        $params[] = $tenantId;

        $this->pdo->prepare($sql)->execute($params);
    }

    public function deletePack(string $tenantId, string $packId): void {
        $stmt = $this->pdo->prepare("DELETE FROM class_packs WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$packId, $tenantId]);
    }
}
