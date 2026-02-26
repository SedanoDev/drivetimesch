<?php
require_once __DIR__ . '/drivetime-backend/config.php'; // Correct path relative to root

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS instructor_schedules (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            tenant_id VARCHAR(36) NOT NULL,
            instructor_id VARCHAR(36) NOT NULL,
            schedule_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
            UNIQUE KEY idx_instr_date (instructor_id, schedule_date)
        );
    ");
    echo "Migration successful.";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage();
}
