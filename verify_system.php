<?php
// verify_system.php
// Run this script to verify that the environment and data are consistent.

require_once __DIR__ . '/drivetime-backend/config.php';
require_once __DIR__ . '/drivetime-backend/api/auth/jwt_helper.php';

echo "--- SYSTEM INTEGRITY CHECK ---\n";

try {
    // 1. Check Tenant
    $tenantId = '11111111-1111-1111-1111-111111111111'; // The fixed ID from schema
    $stmt = $pdo->prepare("SELECT name FROM tenants WHERE id = ?");
    $stmt->execute([$tenantId]);
    $tenantName = $stmt->fetchColumn();

    if ($tenantName) {
        echo "[OK] Tenant found: $tenantName ($tenantId)\n";
    } else {
        die("[FAIL] Tenant not found! Did you run 'php setup_db.php'?\n");
    }

    // 2. Check Student
    $studentEmail = 'alumno@demo.com';
    $stmt = $pdo->prepare("SELECT id, tenant_id FROM users WHERE email = ?");
    $stmt->execute([$studentEmail]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($student && $student['tenant_id'] === $tenantId) {
        echo "[OK] Student found and belongs to correct tenant.\n";
    } else {
        die("[FAIL] Student data mismatch or missing.\n");
    }

    // 3. Check Instructor (Carlos)
    $instructorId = 'inst-carlos';
    $stmt = $pdo->prepare("SELECT tenant_id FROM instructors WHERE id = ?");
    $stmt->execute([$instructorId]);
    $instTenant = $stmt->fetchColumn();

    if ($instTenant === $tenantId) {
        echo "[OK] Instructor 'Carlos' belongs to correct tenant.\n";
    } else {
        die("[FAIL] Instructor tenant mismatch! Expected $tenantId, got $instTenant.\n");
    }

    // 4. Simulate Booking Check (The Logic that was failing)
    echo "[TEST] Simulating Booking Validation...\n";
    // Logic from api/bookings.php
    $checkStmt = $pdo->prepare("SELECT id, name FROM instructors WHERE id = ? AND tenant_id = ?");
    $checkStmt->execute([$instructorId, $student['tenant_id']]);

    if ($checkStmt->rowCount() > 0) {
        echo "[SUCCESS] Booking validation passed! Student and Instructor are compatible.\n";
    } else {
        echo "[FAIL] Booking validation FAILED. 'Instructor not found in this organization'.\n";
    }

    // 5. Check Credits
    $stmt = $pdo->prepare("SELECT remaining_classes FROM student_packs WHERE student_id = ?");
    $stmt->execute([$student['id']]);
    $credits = $stmt->fetchColumn();
    echo "[INFO] Student Credits: $credits\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
