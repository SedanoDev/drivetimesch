<?php
// config.php
// Allow CORS first, so frontend can see errors if autoload fails
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost',
    'http://127.0.0.1',
    'http://18.201.99.184:5173',
    'http://18.201.99.184'
];

// 1. Remove ANY existing headers set by Apache/Server config to prevent duplicates
header_remove('Access-Control-Allow-Origin');
header_remove('Access-Control-Allow-Methods');
header_remove('Access-Control-Allow-Headers');
header_remove('Access-Control-Allow-Credentials');

// 2. Set dynamic headers based on origin
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Optional: Allow * for dev if origin not in list (but Credentials won't work)
    // header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// NOW check dependencies
if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Backend dependencies missing! Please run `docker-compose exec backend composer install` or `./setup_project.sh`.'
    ]);
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';

// Load .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Global variable for backward compatibility
$jwt_secret_key = $_ENV['JWT_SECRET'] ?? 'fallback_secret_do_not_use_in_prod';
