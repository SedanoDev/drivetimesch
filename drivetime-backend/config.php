<?php
// config.php - Development Configuration (Public for this POC)

// Headers for CORS (Allowing access from Frontend)
header('Access-Control-Allow-Origin: *'); // For development only
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database Credentials
// Default for many Docker/MAMP setups is root/root.
// For XAMPP, it's often root/empty. We use root/root as requested.
$host = 'localhost'; // Or 'db' if using Docker compose service names
$db_name = 'drivetime';
$username = 'root';
$password = 'root';

// JWT Secret - Hardcoded for demo simplicity
$jwt_secret_key = 'drivetime_secret_key_demo_123456';

try {
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    // Attempt connection
    $pdo = new PDO($dsn, $username, $password, $options);

} catch (\PDOException $e) {
    // If connection fails, try root without password (common fallback)
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", 'root', '', $options);
    } catch (\PDOException $e2) {
        // Fatal error if both fail
        http_response_code(500);
        echo json_encode([
            'error' => 'Database connection failed',
            'details' => $e->getMessage() . ' | ' . $e2->getMessage()
        ]);
        exit;
    }
}
