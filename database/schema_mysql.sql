CREATE DATABASE IF NOT EXISTS drivetime;
USE drivetime;

-- Instructors table
CREATE TABLE IF NOT EXISTS instructors (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    vehicle_type ENUM('Manual', 'Automatic') DEFAULT 'Manual',
    rating DECIMAL(2, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    instructor_id VARCHAR(36) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    status ENUM('confirmed', 'cancelled', 'pending') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX idx_bookings_instructor_date ON bookings(instructor_id, booking_date);

-- Insert sample data
INSERT INTO instructors (id, name, bio, vehicle_type, rating, reviews_count, image_url) VALUES
(UUID(), 'Carlos Martinez', 'Conducción urbana - Manual', 'Manual', 4.8, 128, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'),
(UUID(), 'Ana Lopez', 'Autopista - Automatico', 'Automatic', 4.9, 94, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana'),
(UUID(), 'Javier Ruiz', 'Conducción nocturna', 'Manual', 4.7, 67, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Javier'),
(UUID(), 'Maria Garcia', 'Maniobras - Manual', 'Manual', 5.0, 210, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria');
