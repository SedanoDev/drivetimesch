<?php

namespace DriveTime\Services;

use DriveTime\Database;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;
use PDO;

class AuthService {
    private $pdo;
    private $jwtSecret;

    public function __construct() {
        $this->pdo = Database::getConnection();

        $secret = $_ENV['JWT_SECRET'] ?? $_SERVER['JWT_SECRET'] ?? getenv('JWT_SECRET');
        if (!$secret || empty(trim($secret))) {
            throw new Exception("JWT Secret not configured");
        }
        $this->jwtSecret = $secret;
    }

    public function login(string $email, string $password, ?string $slug = null): array {
        $user = null;

        if ($slug) {
            // Tenant-specific login
            $stmt = $this->pdo->prepare("
                SELECT u.id, u.tenant_id, u.password_hash, u.role, u.full_name
                FROM users u
                JOIN tenants t ON u.tenant_id = t.id
                WHERE u.email = ? AND t.slug = ?
                LIMIT 1
            ");
            $stmt->execute([$email, $slug]);
            $user = $stmt->fetch();
        } else {
            // Generic login (first match)
            $stmt = $this->pdo->prepare("SELECT id, tenant_id, password_hash, role, full_name FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
        }

        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new Exception("Invalid credentials");
        }

        // Generate Token
        $payload = [
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24), // 24 hours
            'sub' => $user['id'],
            'tenant_id' => $user['tenant_id'],
            'role' => $user['role'],
            'name' => $user['full_name']
        ];

        $token = JWT::encode($payload, $this->jwtSecret, 'HS256');

        return [
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $email,
                'name' => $user['full_name'],
                'role' => $user['role'],
                'tenant_id' => $user['tenant_id']
            ]
        ];
    }

    public function validateToken(string $token): array {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return (array)$decoded;
        } catch (Exception $e) {
            throw new Exception("Invalid Token: " . $e->getMessage());
        }
    }
}
