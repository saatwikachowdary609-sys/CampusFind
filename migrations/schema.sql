-- =====================================================================
-- CAMPUSFIND: Smart College Lost & Found System
-- Siddhartha Academy of Higher Education (SAHE), Vijayawada
-- Google Cloud SQL (MySQL 8.0) Relational Production Schema
-- =====================================================================

CREATE DATABASE IF NOT EXISTS campusfind_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campusfind_db;

-- 1. Users Table (Role-based access control: Student, Security, Admin)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('student', 'security', 'admin') NOT NULL DEFAULT 'student',
    department VARCHAR(100) NOT NULL,
    student_or_staff_id VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- 2. Items Table (Lost and Found Reports)
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(64) PRIMARY KEY,
    reference_code VARCHAR(32) NOT NULL UNIQUE,
    type ENUM('lost', 'found') NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(60) NOT NULL,
    brand_model VARCHAR(100) NULL,
    color VARCHAR(60) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(150) NOT NULL,
    date_seen_or_found TIMESTAMP NOT NULL,
    photo_url VARCHAR(512) NULL, -- Stored in Google Cloud Storage, NOT as raw bytes
    status ENUM('active', 'matched', 'claimed', 'returned', 'closed') NOT NULL DEFAULT 'active',
    current_custody ENUM(
        'with_finder',
        'awaiting_handover',
        'received_by_security',
        'stored_securely',
        'claim_pending',
        'approved_for_collection',
        'returned_to_owner'
    ) NOT NULL DEFAULT 'with_finder',
    security_desk_location VARCHAR(120) NULL,
    security_staff_id VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (security_staff_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_item_type_status (type, status),
    INDEX idx_item_category (category),
    INDEX idx_item_location (location),
    INDEX idx_item_date (date_seen_or_found)
) ENGINE=InnoDB;

-- 3. Private Item Details Table (Hidden Verification Secrets - Never returned publicly)
CREATE TABLE IF NOT EXISTS private_item_details (
    id VARCHAR(64) PRIMARY KEY,
    item_id VARCHAR(64) NOT NULL UNIQUE,
    hidden_characteristic TEXT NOT NULL,
    verification_answer_hash VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Matches Table (AI-Powered Matching Records via Gemini on Vertex AI)
CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(64) PRIMARY KEY,
    lost_item_id VARCHAR(64) NOT NULL,
    found_item_id VARCHAR(64) NOT NULL,
    match_score INT NOT NULL CHECK (match_score BETWEEN 0 AND 100),
    match_reasons JSON NOT NULL,
    ai_model VARCHAR(64) NOT NULL DEFAULT 'gemini-3.8-flash',
    status ENUM('suggested', 'reviewed', 'confirmed', 'dismissed') NOT NULL DEFAULT 'suggested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lost_item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (found_item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE KEY uq_match_pair (lost_item_id, found_item_id),
    INDEX idx_match_score (match_score)
) ENGINE=InnoDB;

-- 5. Claims Table (Ownership Verification Workflow)
CREATE TABLE IF NOT EXISTS claims (
    id VARCHAR(64) PRIMARY KEY,
    claim_reference VARCHAR(32) NOT NULL UNIQUE,
    item_id VARCHAR(64) NOT NULL,
    claimant_id VARCHAR(64) NOT NULL,
    proof_description TEXT NOT NULL,
    proof_photo_url VARCHAR(512) NULL,
    hidden_detail_attempt TEXT NULL,
    status ENUM('pending', 'under_review', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
    reviewer_id VARCHAR(64) NULL,
    review_notes TEXT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (claimant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_claim_status (status)
) ENGINE=InnoDB;

-- 6. Collection Records Table (Security Desk Physical Handover & Custody)
CREATE TABLE IF NOT EXISTS collection_records (
    id VARCHAR(64) PRIMARY KEY,
    item_id VARCHAR(64) NOT NULL,
    claim_id VARCHAR(64) NULL,
    security_staff_id VARCHAR(64) NOT NULL,
    physical_storage_location VARCHAR(120) NOT NULL,
    custody_status VARCHAR(60) NOT NULL,
    handover_date TIMESTAMP NULL,
    collector_name VARCHAR(150) NULL,
    collector_id_proof VARCHAR(100) NULL,
    handover_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL,
    FOREIGN KEY (security_staff_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    type ENUM('match_found', 'claim_update', 'custody_update', 'system') NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    reference_id VARCHAR(64) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_status ENUM('delivered', 'queued', 'failed') NOT NULL DEFAULT 'delivered',
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id, is_read)
) ENGINE=InnoDB;

-- 8. Audit Logs Table (Administrative traceability & compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_time (created_at)
) ENGINE=InnoDB;
