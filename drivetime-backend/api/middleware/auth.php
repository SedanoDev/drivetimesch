<?php
// Simple Middleware to protect routes

function requireAuth() {
    global $jwt_secret_key; // Defined in config.php
    
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        
        try {
            $decoded = JWT::decode($token, $jwt_secret_key); 
            if (!$decoded) {
                throw new Exception("Invalid Token");
            }
            return $decoded; // Returns payload (user info)
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized: ' . $e->getMessage()]);
            exit;
        }
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Token not provided']);
        exit;
    }
}
