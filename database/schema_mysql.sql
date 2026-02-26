-- Create Database
CREATE DATABASE IF NOT EXISTS drivetime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE drivetime;

-- Disable FK checks to allow dropping/recreating tables in any order
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS student_packs;
DROP TABLE IF EXISTS class_packs;
DROP TABLE IF EXISTS availabilities;
DROP TABLE IF EXISTS instructors;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tenants table (Autoescuelas)
CREATE TABLE tenants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,

    -- Branding
    primary_color VARCHAR(7) DEFAULT '#2563EB',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_address TEXT,

    -- Business Rules
    class_duration_minutes INT DEFAULT 60,
    class_price DECIMAL(10, 2) DEFAULT 30.00,
    currency VARCHAR(10) DEFAULT 'EUR',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Users table (Platform Users)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin', 'instructor', 'student') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (tenant_id, email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 3. Vehicles table
CREATE TABLE vehicles (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    plate VARCHAR(20) NOT NULL,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 4. Instructors table
CREATE TABLE instructors (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) UNIQUE, -- Link to login user
    vehicle_id VARCHAR(36),     -- Link to vehicle
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    vehicle_type ENUM('Manual', 'Automatic') DEFAULT 'Manual',
    rating DECIMAL(2, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- 5. Availabilities (Schedule)
CREATE TABLE availabilities (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    day_of_week TINYINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
);

-- 6. Class Packs (Products)
CREATE TABLE class_packs (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    classes_count INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 7. Student Packs (Purchased Credits)
CREATE TABLE student_packs (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    pack_id VARCHAR(36),
    initial_classes INT NOT NULL,
    remaining_classes INT NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date DATE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pack_id) REFERENCES class_packs(id) ON DELETE SET NULL
);

-- 8. Bookings (Reservations)
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    status ENUM('confirmed', 'cancelled', 'pending', 'completed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Reviews
CREATE TABLE reviews (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36) NOT NULL UNIQUE,
    student_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);


-- ==========================================
-- SEED DATA (Deterministic UUIDs)
-- ==========================================

-- A. Tenant: "Autoescuela Demo"
-- ID: 11111111-1111-1111-1111-111111111111
INSERT INTO tenants (id, name, slug, contact_email, class_price) VALUES
('11111111-1111-1111-1111-111111111111', 'Autoescuela Demo', 'demo', 'info@demo.com', 35.00);

-- B. Users
-- Password '123456' hash: $2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786

-- 1. SuperAdmin (Platform Owner)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'superadmin@drivetime.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Super Admin', 'superadmin');

-- 2. School Admin
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin@demo.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Director Demo', 'admin');

-- 3. Instructors (Login Users)
-- Carlos (Manual)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'carlos@demo.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Carlos Martinez', 'instructor');
-- Ana (Auto)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'ana@demo.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Ana Lopez', 'instructor');

-- 4. Students
-- Alumno Principal
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'alumno@demo.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Juan Alumno', 'student');
-- Alumno Secundario (para pruebas de carga)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'maria@demo.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Maria Estudiante', 'student');


-- C. Vehicles
INSERT INTO vehicles (id, tenant_id, make, model, plate, status) VALUES
('aaaa-aaaa', '11111111-1111-1111-1111-111111111111', 'Toyota', 'Yaris', '1234 BBB', 'active'),
('bbbb-bbbb', '11111111-1111-1111-1111-111111111111', 'Volkswagen', 'Golf', '5678 CCC', 'active');

-- D. Instructors (Profiles)
INSERT INTO instructors (id, tenant_id, user_id, vehicle_id, name, bio, vehicle_type, rating, reviews_count) VALUES
('inst-carlos', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'aaaa-aaaa', 'Carlos Martinez', 'Experto en ciudad', 'Manual', 4.9, 15),
('inst-ana',    '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'bbbb-bbbb', 'Ana Lopez', 'Paciencia infinita', 'Automatic', 5.0, 8);

-- E. Availability (Horarios)
-- Carlos: Mon, Wed, Fri (09:00 - 18:00)
INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time) VALUES
(UUID(), '11111111-1111-1111-1111-111111111111', 'inst-carlos', 1, '09:00:00', '18:00:00'),
(UUID(), '11111111-1111-1111-1111-111111111111', 'inst-carlos', 3, '09:00:00', '18:00:00'),
(UUID(), '11111111-1111-1111-1111-111111111111', 'inst-carlos', 5, '09:00:00', '14:00:00');

-- Ana: Tue, Thu (10:00 - 19:00)
INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time) VALUES
(UUID(), '11111111-1111-1111-1111-111111111111', 'inst-ana', 2, '10:00:00', '19:00:00'),
(UUID(), '11111111-1111-1111-1111-111111111111', 'inst-ana', 4, '10:00:00', '19:00:00');

-- F. Class Packs
INSERT INTO class_packs (id, tenant_id, name, classes_count, price, discount_percentage) VALUES
('pack-5',  '11111111-1111-1111-1111-111111111111', 'Pack 5 Clases', 5, 165.00, 5.0),
('pack-10', '11111111-1111-1111-1111-111111111111', 'Pack 10 Clases', 10, 315.00, 10.0),
('pack-20', '11111111-1111-1111-1111-111111111111', 'Pack 20 Clases', 20, 600.00, 15.0);

-- G. Student Packs (Giving credits to Juan Alumno)
-- Pack comprado hoy, válido 6 meses. Tiene 5 clases, gastó 0 -> quedan 5.
INSERT INTO student_packs (id, tenant_id, student_id, pack_id, initial_classes, remaining_classes, expiration_date, purchase_date) VALUES
('stu-pack-1', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'pack-5', 5, 5, DATE_ADD(CURDATE(), INTERVAL 6 MONTH), NOW());

-- H. Bookings (History)
-- 1. Completed class last week (Ana)
INSERT INTO bookings (id, tenant_id, instructor_id, student_id, student_name, booking_date, start_time, status) VALUES
('book-1', '11111111-1111-1111-1111-111111111111', 'inst-ana', '55555555-5555-5555-5555-555555555555', 'Juan Alumno', DATE_SUB(CURDATE(), INTERVAL 7 DAY), '10:00:00', 'completed');

-- 2. Pending class tomorrow (Carlos)
INSERT INTO bookings (id, tenant_id, instructor_id, student_id, student_name, booking_date, start_time, status) VALUES
('book-2', '11111111-1111-1111-1111-111111111111', 'inst-carlos', '55555555-5555-5555-5555-555555555555', 'Juan Alumno', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', 'pending');

-- I. Reviews
INSERT INTO reviews (id, tenant_id, booking_id, student_id, instructor_id, rating, comment) VALUES
(UUID(), '11111111-1111-1111-1111-111111111111', 'book-1', '55555555-5555-5555-5555-555555555555', 'inst-ana', 5, '¡Ana explica genial! Me sentí muy seguro.');
