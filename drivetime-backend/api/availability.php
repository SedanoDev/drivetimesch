<?php
require_once __DIR__ . '/../config.php';

// Mock availability logic for now
// In a real app, this would query the `bookings` table to find free slots.

$slots = [
    ['time' => '09:00', 'available' => true],
    ['time' => '10:00', 'available' => false],
    ['time' => '11:00', 'available' => true],
    ['time' => '12:00', 'available' => false],
    ['time' => '13:00', 'available' => true],
    ['time' => '16:00', 'available' => true],
    ['time' => '17:00', 'available' => false],
    ['time' => '18:00', 'available' => true],
];

echo json_encode($slots);
