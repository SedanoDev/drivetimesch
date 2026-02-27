<?php
// api/bookings.php
// Start output buffering to capture any unwanted output (warnings, notices, etc.)
ob_start();

// Disable error display to prevent HTML error output in JSON API
ini_set('display_errors', 0);

require_once __DIR__ . '/../config.php';

use DriveTime\Services\AuthService;
use DriveTime\Services\BookingService;

// Auth Check
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$user = null;

try {
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $authService = new AuthService();
        $user = $authService->validateToken($matches[1]);
    } else {
        throw new Exception("Token required", 401);
    }
} catch (Exception $e) {
    ob_clean();
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

$bookingService = new BookingService();

try {
    // GET: List Bookings
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $filters = [
            'date' => $_GET['date'] ?? null,
            'instructor_id' => $_GET['instructor_id'] ?? null
        ];
        $bookings = $bookingService->getBookings($user, $filters);

        ob_clean();
        echo json_encode($bookings);
    }

    // POST: Create Booking
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) {
            throw new Exception("Invalid or empty JSON body", 400);
        }
        $bookingService->createBooking($user, $input);
        http_response_code(201);

        ob_clean();
        echo json_encode(['message' => 'Booking request sent successfully']);
    }

    // PUT: Update Booking
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) {
            throw new Exception("Invalid or empty JSON body", 400);
        }
        if (!isset($input['id'])) throw new Exception("Missing ID");

        $bookingService->updateBooking($user, $input['id'], $input);

        ob_clean();
        echo json_encode(['message' => 'Booking updated']);
    }

    // DELETE
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
         // Implement delete if needed, usually just status=cancelled via PUT is better
         http_response_code(405);
         ob_clean();
         echo json_encode(['error' => 'Use PUT to cancel bookings']);
    }

} catch (\Throwable $e) {
    $code = $e->getCode() ?: 500;
    // Map common codes
    if ($code < 100 || $code > 599) $code = 500;

    ob_clean();
    http_response_code($code);
    echo json_encode(['error' => $e->getMessage()]);
}
