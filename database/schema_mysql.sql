CREATE DATABASE IF NOT EXISTS drivetime;
USE drivetime;

-- Tenants table (Autoescuelas)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- Para urls: autoescuela-madrid.drivetime.com

    -- Configuración extendida
    primary_color VARCHAR(7) DEFAULT '#2563EB',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_address TEXT,
    social_links JSON, -- Facebook, Instagram, Twitter

    -- Reglas de negocio
    class_duration_minutes INT DEFAULT 60,
    class_price DECIMAL(10, 2) DEFAULT 30.00,
    min_booking_notice_hours INT DEFAULT 24,
    min_cancellation_notice_hours INT DEFAULT 24,
    min_practice_hours_required INT DEFAULT 20,
    welcome_message TEXT,
    currency VARCHAR(10) DEFAULT 'EUR',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (tenant_id, email), -- Email único por tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Vehicles table (Vehículos)
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36), -- Optional assignment
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    plate VARCHAR(20) NOT NULL,
    image_url TEXT,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    last_maintenance DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY (tenant_id, plate)
);

-- Instructors table (Profesores)
CREATE TABLE IF NOT EXISTS instructors (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) UNIQUE, -- Optional link to user login
    vehicle_id VARCHAR(36), -- Link to assigned vehicle (can be null)
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    vehicle_type ENUM('Manual', 'Automatic') DEFAULT 'Manual',
    rating DECIMAL(2, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- Availabilities table (Horarios disponibles de los profesores)
-- Defines general availability per day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
CREATE TABLE IF NOT EXISTS availabilities (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    day_of_week TINYINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL, -- e.g., '09:00:00'
    end_time TIME NOT NULL,   -- e.g., '18:00:00'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
    UNIQUE KEY idx_avail_instr_day (instructor_id, day_of_week, start_time) -- Prevent overlapping slots for same instructor/day
);

-- Class Packs (Bonos de clases)
CREATE TABLE IF NOT EXISTS class_packs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    classes_count INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Student Packs (Bonos comprados por alumnos)
CREATE TABLE IF NOT EXISTS student_packs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    pack_id VARCHAR(36), -- Can be null if manual addition
    initial_classes INT NOT NULL,
    remaining_classes INT NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date DATE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pack_id) REFERENCES class_packs(id) ON DELETE SET NULL
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
    status ENUM('confirmed', 'cancelled', 'pending', 'completed') DEFAULT 'confirmed',
    notes TEXT, -- Post-class notes from instructor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_bookings_instructor_date ON bookings(instructor_id, booking_date);
CREATE INDEX idx_bookings_tenant_status ON bookings(tenant_id, status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- SEED DATA (Datos de prueba)

-- 1. Create a Tenant
SET @tenant_id = UUID();
INSERT INTO tenants (id, name, slug, contact_email, class_price, welcome_message)
VALUES (@tenant_id, 'Autoescuela Demo', 'demo', 'info@demo.com', 35.00, '¡Bienvenido a Autoescuela Demo! Estamos aquí para ayudarte a obtener tu carnet.');

-- 2. Create Users (Password: '123456' hashed with PASSWORD_DEFAULT)
-- Hash generated via PHP: password_hash('123456', PASSWORD_DEFAULT)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
(UUID(), @tenant_id, 'admin@demo.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Admin Demo', 'admin'),
(UUID(), @tenant_id, 'alumno@demo.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Alumno Demo', 'student'),
(UUID(), @tenant_id, 'superadmin@drivetime.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Super Admin', 'superadmin');

-- 3. Create Vehicles
SET @veh1_id = UUID();
SET @veh2_id = UUID();

INSERT INTO vehicles (id, tenant_id, make, model, plate, status) VALUES
(@veh1_id, @tenant_id, 'Toyota', 'Yaris', '1234 BBB', 'active'),
(@veh2_id, @tenant_id, 'Volkswagen', 'Golf', '5678 CCC', 'active');

-- 4. Create Instructor Users & Profiles
SET @inst1_id = UUID();
SET @inst2_id = UUID();

INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
(@inst1_id, @tenant_id, 'carlos@demo.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Carlos Martinez', 'instructor'),
(@inst2_id, @tenant_id, 'ana@demo.com', '$2y$10$jQ7rInDjChpvPW7nI7D3OeRf0FYFxdQyDN5prUsJluw4rKvgre786', 'Ana Lopez', 'instructor');

INSERT INTO instructors (id, tenant_id, user_id, vehicle_id, name, bio, vehicle_type, rating, reviews_count, image_url) VALUES
(UUID(), @tenant_id, @inst1_id, @veh1_id, 'Carlos Martinez', 'Conducción urbana - Manual', 'Manual', 4.8, 128, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'),
(UUID(), @tenant_id, @inst2_id, @veh2_id, 'Ana Lopez', 'Autopista - Automatico', 'Automatic', 4.9, 94, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana');

-- 5. Set Availability for Instructors (Mon-Fri, 9am-6pm)
-- Carlos (Manual) works Mon, Wed, Fri
INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time)
SELECT UUID(), @tenant_id, id, 1, '09:00:00', '18:00:00' FROM instructors WHERE name = 'Carlos Martinez'; -- Mon
INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time)
SELECT UUID(), @tenant_id, id, 3, '09:00:00', '18:00:00' FROM instructors WHERE name = 'Carlos Martinez'; -- Wed
INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time)
SELECT UUID(), @tenant_id, id, 5, '09:00:00', '14:00:00' FROM instructors WHERE name = 'Carlos Martinez'; -- Fri (Half day)

-- Ana (Automatic) works Tue, Thu
INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time)
SELECT UUID(), @tenant_id, id, 2, '10:00:00', '19:00:00' FROM instructors WHERE name = 'Ana Lopez'; -- Tue
INSERT INTO availabilities (id, tenant_id, instructor_id, day_of_week, start_time, end_time)
SELECT UUID(), @tenant_id, id, 4, '10:00:00', '19:00:00' FROM instructors WHERE name = 'Ana Lopez'; -- Thu

-- 6. Class Packs
INSERT INTO class_packs (id, tenant_id, name, classes_count, price, discount_percentage) VALUES
(UUID(), @tenant_id, 'Pack 5 Clases', 5, 165.00, 5.00),
(UUID(), @tenant_id, 'Pack 10 Clases', 10, 315.00, 10.00);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36) NOT NULL UNIQUE, -- One review per booking
    student_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
);
