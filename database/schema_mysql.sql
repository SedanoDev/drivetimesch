CREATE DATABASE IF NOT EXISTS drivetime;
USE drivetime;

-- Tenants table (Autoescuelas)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- Para urls: autoescuela-madrid.drivetime.com
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (Usuarios de la plataforma)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin', 'instructor', 'student') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (tenant_id, email), -- Email único por tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Instructors table (Profesores)
-- Linked to a user account for login? Maybe. Or kept separate for now.
-- Let's keep separate for simplicity in this migration, but link via tenant_id.
CREATE TABLE IF NOT EXISTS instructors (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) UNIQUE, -- Optional link to user login
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    vehicle_type ENUM('Manual', 'Automatic') DEFAULT 'Manual',
    rating DECIMAL(2, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Bookings table (Reservas)
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL, -- Link to student user
    student_name VARCHAR(255) NOT NULL, -- Denormalized for display
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    status ENUM('confirmed', 'cancelled', 'pending') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_bookings_instructor_date ON bookings(instructor_id, booking_date);
CREATE INDEX idx_users_email ON users(email);

-- SEED DATA (Datos de prueba)

-- 1. Create a Tenant
SET @tenant_id = UUID();
INSERT INTO tenants (id, name, slug) VALUES (@tenant_id, 'Autoescuela Demo', 'demo');

-- 2. Create Users (Password: '123456' hashed with PASSWORD_DEFAULT)
-- Use a known hash for '123456': $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
(UUID(), @tenant_id, 'admin@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin Demo', 'admin'),
(UUID(), @tenant_id, 'alumno@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alumno Demo', 'student');

-- 3. Create Instructor Users & Profiles
SET @inst1_id = UUID();
SET @inst2_id = UUID();

INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
(@inst1_id, @tenant_id, 'carlos@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos Martinez', 'instructor'),
(@inst2_id, @tenant_id, 'ana@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana Lopez', 'instructor');

INSERT INTO instructors (id, tenant_id, user_id, name, bio, vehicle_type, rating, reviews_count, image_url) VALUES
(UUID(), @tenant_id, @inst1_id, 'Carlos Martinez', 'Conducción urbana - Manual', 'Manual', 4.8, 128, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'),
(UUID(), @tenant_id, @inst2_id, 'Ana Lopez', 'Autopista - Automatico', 'Automatic', 4.9, 94, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana');
