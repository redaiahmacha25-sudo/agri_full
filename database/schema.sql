-- ============================================================
-- AGRICONNECT DATABASE SCHEMA
-- Production-Grade E-Governance Platform
-- ============================================================

CREATE DATABASE IF NOT EXISTS agriconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agriconnect;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('farmer', 'employee', 'admin') NOT NULL DEFAULT 'farmer',
    aadhar_number VARCHAR(12),
    village VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Andhra Pradesh',
    pincode VARCHAR(6),
    bank_account VARCHAR(20),
    ifsc_code VARCHAR(11),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_phone (phone)
);

-- ============================================================
-- CROPS TABLE
-- ============================================================
CREATE TABLE crops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_telugu VARCHAR(100),
    category ENUM('cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'other') DEFAULT 'cereal',
    govt_price DECIMAL(10,2) NOT NULL COMMENT 'MSP per quintal in INR',
    unit VARCHAR(20) DEFAULT 'quintal',
    season ENUM('kharif', 'rabi', 'zaid', 'all') DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_season (season)
);

-- ============================================================
-- SELL REQUESTS TABLE
-- ============================================================
CREATE TABLE sell_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    crop_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL COMMENT 'in quintals',
    govt_price DECIMAL(10,2),
    expected_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * govt_price) STORED,
    image_url VARCHAR(500),
    geo_lat DECIMAL(10,8),
    geo_lng DECIMAL(11,8),
    village VARCHAR(100),
    harvest_date DATE,
    notes TEXT,
    status ENUM('pending', 'verified', 'rejected', 'approved', 'scheduled', 'completed', 'payment_done') DEFAULT 'pending',
    verified_by INT,
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    approved_by INT,
    approved_at TIMESTAMP,
    procurement_date DATE,
    payment_status ENUM('pending', 'processing', 'done') DEFAULT 'pending',
    payment_amount DECIMAL(12,2),
    transaction_ref VARCHAR(100),
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE RESTRICT,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_farmer (farmer_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- ============================================================
-- SERVICE REQUESTS TABLE
-- ============================================================
CREATE TABLE service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    type ENUM('subsidy', 'complaint', 'crop_damage', 'loan', 'scheme', 'other') NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    media_url VARCHAR(500),
    status ENUM('pending', 'in_progress', 'escalated', 'resolved', 'rejected') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    handled_by INT,
    assigned_at TIMESTAMP,
    escalated_to INT,
    escalated_at TIMESTAMP,
    escalation_reason TEXT,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (escalated_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_farmer (farmer_id),
    INDEX idx_status (status),
    INDEX idx_type (type)
);

-- ============================================================
-- PROCUREMENT TABLE
-- ============================================================
CREATE TABLE procurement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL UNIQUE,
    schedule_date DATE NOT NULL,
    schedule_time TIME,
    location VARCHAR(200),
    officer_name VARCHAR(100),
    vehicle_number VARCHAR(20),
    actual_quantity DECIMAL(10,2),
    payment_status ENUM('pending', 'processing', 'done') DEFAULT 'pending',
    payment_amount DECIMAL(12,2),
    transaction_ref VARCHAR(100),
    bank_ref VARCHAR(100),
    payment_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES sell_requests(id) ON DELETE CASCADE
);

-- ============================================================
-- REMARKS / ACTIVITY LOG TABLE
-- ============================================================
CREATE TABLE remarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('sell_request', 'service_request') NOT NULL,
    entity_id INT NOT NULL,
    message TEXT NOT NULL,
    created_by INT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_by (created_by)
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read)
);

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    target_role ENUM('all', 'farmer', 'employee', 'admin') DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    expires_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Admin user (password: Admin@123)
INSERT INTO users (name, phone, email, password_hash, role, district, village) VALUES
('System Administrator', '9000000001', 'admin@agriconnect.gov.in', '$2b$10$rQZ8kHWnvhSGjOJ1BKYvIeXEXJPQIhVN4VqEYJBdKMHpGkWZe5pAm', 'admin', 'Nellore', 'Secretariat'),
('Ramaiah Sachivalayam', '9000000002', 'employee1@agriconnect.gov.in', '$2b$10$rQZ8kHWnvhSGjOJ1BKYvIeXEXJPQIhVN4VqEYJBdKMHpGkWZe5pAm', 'employee', 'Nellore', 'Kovur'),
('Suresh Kumar', '9000000003', 'farmer1@agriconnect.gov.in', '$2b$10$rQZ8kHWnvhSGjOJ1BKYvIeXEXJPQIhVN4VqEYJBdKMHpGkWZe5pAm', 'farmer', 'Nellore', 'Allur'),
('Lakshmi Devi', '9000000004', 'farmer2@agriconnect.gov.in', '$2b$10$rQZ8kHWnvhSGjOJ1BKYvIeXEXJPQIhVN4VqEYJBdKMHpGkWZe5pAm', 'farmer', 'Nellore', 'Kavali'),
('Venkata Rao', '9000000005', 'farmer3@agriconnect.gov.in', '$2b$10$rQZ8kHWnvhSGjOJ1BKYvIeXEXJPQIhVN4VqEYJBdKMHpGkWZe5pAm', 'farmer', 'Nellore', 'Gudur');

INSERT INTO crops (name, name_telugu, category, govt_price, season, updated_by) VALUES
('Paddy (Common)', 'వరి (సాధారణ)', 'cereal', 2183.00, 'kharif', 1),
('Paddy (Grade A)', 'వరి (గ్రేడ్ A)', 'cereal', 2203.00, 'kharif', 1),
('Wheat', 'గోధుమ', 'cereal', 2275.00, 'rabi', 1),
('Maize', 'మొక్కజొన్న', 'cereal', 2090.00, 'kharif', 1),
('Groundnut', 'వేరుశనగ', 'oilseed', 6783.00, 'kharif', 1),
('Sunflower', 'పొద్దుతిరుగుడు', 'oilseed', 6760.00, 'kharif', 1),
('Red Gram (Tur)', 'కంది పప్పు', 'pulse', 7000.00, 'kharif', 1),
('Black Gram', 'మినప పప్పు', 'pulse', 8558.00, 'kharif', 1),
('Green Gram', 'పెసర పప్పు', 'pulse', 8682.00, 'kharif', 1),
('Cotton (Medium)', 'పత్తి (మీడియం)', 'other', 7121.00, 'kharif', 1),
('Cotton (Long)', 'పత్తి (లాంగ్)', 'other', 7521.00, 'kharif', 1),
('Soybean', 'సోయాబీన్', 'oilseed', 4600.00, 'kharif', 1);

-- Sample sell requests
INSERT INTO sell_requests (farmer_id, crop_id, quantity, village, status, notes) VALUES
(3, 1, 25.5, 'Allur', 'pending', 'Good quality paddy harvested last week'),
(4, 5, 15.0, 'Kavali', 'verified', 'Fresh groundnut harvest'),
(5, 7, 10.0, 'Gudur', 'approved', 'Organic red gram'),
(3, 10, 20.0, 'Allur', 'completed', 'Medium variety cotton');

-- Sample service requests
insert into service_requests (farmer_id, type, subject, description, status, priority) values
(3, 'subsidy', 'PM-KISAN Payment Delay', 'I have not received the PM-KISAN payment for the last quarter. Please check and resolve.', 'pending', 'high'),
(4, 'complaint', 'Crop Damage Due to Pests', 'My groundnut crop has been severely damaged by pests. I need assistance and compensation.', 'in_progress', 'urgent'),
(5, 'crop_damage', 'Flood Damage to Red Gram', 'Recent floods have damaged my red gram crop. Requesting help for recovery and compensation.', 'escalated', 'high'),
(3, 'loan', 'Request for Agricultural Loan', 'I want to apply for an agricultural loan to buy new equipment. Please guide me through the process.', 'resolved', 'medium');
-- Announcements
INSERT INTO announcements (title, content, target_role, created_by) VALUES
('MSP Rates Updated for Kharif 2024-25', 'The Government has announced new Minimum Support Prices for Kharif crops 2024-25. All procurement will be done at revised rates. Please check the crop price section for updated rates.', 'all', 1),
('PM-KISAN 17th Installment Released', 'The 17th installment of PM-KISAN scheme has been released. Eligible farmers will receive ₹2000 directly to their bank accounts. Check your bank account within 3-5 working days.', 'farmer', 1),
('E-KYC Mandatory for All Farmers', 'E-KYC verification is now mandatory for all farmers to avail government benefits. Please visit your nearest Sachivalayam with Aadhar card to complete verification.', 'farmer', 1);
