-- ============================================================
-- PermitHub Database Schema
-- MySQL 8.0+
-- ============================================================
CREATE DATABASE IF NOT EXISTS permithub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE permithub;

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- SEMESTERS
-- ============================================================
CREATE TABLE semesters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    default_leave_limit INT DEFAULT 20,
    academic_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- USERS (all roles)
-- ============================================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    profile_pic VARCHAR(500),
    role ENUM('STUDENT','FACULTY','HOD','WARDEN','AO','PRINCIPAL','SECURITY','PARENT') NOT NULL,
    department_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    is_first_login BOOLEAN DEFAULT TRUE,
    remember_token VARCHAR(500),
    password_reset_token VARCHAR(255),
    password_reset_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ============================================================
-- FACULTY DETAILS
-- ============================================================
CREATE TABLE faculty_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    employee_id VARCHAR(30) UNIQUE,
    designation VARCHAR(100),
    is_mentor BOOLEAN DEFAULT FALSE,
    is_class_advisor BOOLEAN DEFAULT FALSE,
    is_event_coordinator BOOLEAN DEFAULT FALSE,
    advisor_year INT,
    advisor_section VARCHAR(5),
    advisor_department_id BIGINT,
    event_types JSON COMMENT 'Array of event types this faculty coordinates',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (advisor_department_id) REFERENCES departments(id)
);

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    register_number VARCHAR(30) NOT NULL UNIQUE,
    roll_number VARCHAR(20),
    year INT NOT NULL,
    section VARCHAR(5) NOT NULL,
    department_id BIGINT NOT NULL,
    semester_id BIGINT,
    current_mentor_id BIGINT COMMENT 'FK to faculty_details.id',
    class_advisor_id BIGINT COMMENT 'FK to faculty_details.id',
    is_hosteler BOOLEAN DEFAULT FALSE,
    hostel_name VARCHAR(100),
    room_number VARCHAR(20),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(15),
    parent_email VARCHAR(150),
    parent_whatsapp VARCHAR(15),
    address TEXT,
    blood_group VARCHAR(5),
    dob DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    FOREIGN KEY (current_mentor_id) REFERENCES faculty_details(id),
    FOREIGN KEY (class_advisor_id) REFERENCES faculty_details(id)
);

-- ============================================================
-- LEAVE BALANCE
-- ============================================================
CREATE TABLE leave_balances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    semester_id BIGINT NOT NULL,
    total_leaves INT DEFAULT 20,
    used_leaves INT DEFAULT 0,
    remaining_leaves INT GENERATED ALWAYS AS (total_leaves - used_leaves) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_semester (student_id, semester_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
CREATE TABLE leave_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    semester_id BIGINT NOT NULL,
    category ENUM('SICK','MEDICAL','EMERGENCY','FAMILY','PERSONAL','OTHER') NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT NOT NULL,
    is_emergency BOOLEAN DEFAULT FALSE,
    medical_certificate VARCHAR(500),
    status ENUM('PENDING','MENTOR_APPROVED','ADVISOR_APPROVED','HOD_APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
    mentor_id BIGINT,
    mentor_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    mentor_remarks TEXT,
    mentor_action_at TIMESTAMP,
    advisor_id BIGINT,
    advisor_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    advisor_remarks TEXT,
    advisor_action_at TIMESTAMP,
    hod_id BIGINT,
    hod_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    hod_remarks TEXT,
    hod_action_at TIMESTAMP,
    rejected_by ENUM('MENTOR','ADVISOR','HOD'),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    FOREIGN KEY (mentor_id) REFERENCES faculty_details(id),
    FOREIGN KEY (advisor_id) REFERENCES faculty_details(id),
    FOREIGN KEY (hod_id) REFERENCES users(id)
);

-- ============================================================
-- OD REQUESTS
-- ============================================================
CREATE TABLE od_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    semester_id BIGINT NOT NULL,
    event_type ENUM('SYMPOSIUM','HACKATHON','INTERNSHIP','WORKSHOP','CONFERENCE','CULTURAL','SPORTS','OTHER') NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    organizer VARCHAR(200),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_days INT NOT NULL,
    location VARCHAR(300),
    description TEXT,
    proof_document VARCHAR(500),
    status ENUM('PENDING','MENTOR_APPROVED','COORDINATOR_APPROVED','ADVISOR_APPROVED','HOD_APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
    mentor_id BIGINT,
    mentor_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    mentor_remarks TEXT,
    mentor_action_at TIMESTAMP,
    coordinator_id BIGINT,
    coordinator_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    coordinator_remarks TEXT,
    coordinator_action_at TIMESTAMP,
    advisor_id BIGINT,
    advisor_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    advisor_remarks TEXT,
    advisor_action_at TIMESTAMP,
    hod_id BIGINT,
    hod_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    hod_remarks TEXT,
    hod_action_at TIMESTAMP,
    rejected_by ENUM('MENTOR','COORDINATOR','ADVISOR','HOD'),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    FOREIGN KEY (mentor_id) REFERENCES faculty_details(id),
    FOREIGN KEY (coordinator_id) REFERENCES faculty_details(id),
    FOREIGN KEY (advisor_id) REFERENCES faculty_details(id),
    FOREIGN KEY (hod_id) REFERENCES users(id)
);

-- ============================================================
-- OUTPASS REQUESTS
-- ============================================================
CREATE TABLE outpass_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    out_datetime DATETIME NOT NULL,
    return_datetime DATETIME NOT NULL,
    duration_hours DECIMAL(5,2),
    destination VARCHAR(300) NOT NULL,
    reason TEXT NOT NULL,
    emergency_contact VARCHAR(15),
    status ENUM('PENDING','MENTOR_APPROVED','PARENT_APPROVED','ADVISOR_APPROVED','WARDEN_APPROVED','AO_APPROVED','PRINCIPAL_APPROVED','REJECTED','CANCELLED','EXPIRED') DEFAULT 'PENDING',
    mentor_id BIGINT,
    mentor_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    mentor_remarks TEXT,
    mentor_action_at TIMESTAMP,
    parent_token VARCHAR(255) UNIQUE,
    parent_token_expiry TIMESTAMP,
    parent_status ENUM('PENDING','APPROVED','REJECTED'),
    parent_remarks TEXT,
    parent_action_at TIMESTAMP,
    advisor_id BIGINT,
    advisor_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    advisor_remarks TEXT,
    advisor_action_at TIMESTAMP,
    warden_id BIGINT,
    warden_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    warden_remarks TEXT,
    warden_action_at TIMESTAMP,
    ao_id BIGINT,
    ao_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    ao_remarks TEXT,
    ao_action_at TIMESTAMP,
    principal_id BIGINT,
    principal_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    principal_remarks TEXT,
    principal_action_at TIMESTAMP,
    qr_code VARCHAR(500),
    qr_generated_at TIMESTAMP,
    rejected_by ENUM('MENTOR','PARENT','ADVISOR','WARDEN','AO','PRINCIPAL'),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (mentor_id) REFERENCES faculty_details(id),
    FOREIGN KEY (advisor_id) REFERENCES faculty_details(id),
    FOREIGN KEY (warden_id) REFERENCES users(id),
    FOREIGN KEY (ao_id) REFERENCES users(id),
    FOREIGN KEY (principal_id) REFERENCES users(id)
);

-- ============================================================
-- GATE SCANS
-- ============================================================
CREATE TABLE gate_scans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outpass_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    security_id BIGINT NOT NULL,
    scan_type ENUM('EXIT','ENTRY') NOT NULL,
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_late BOOLEAN DEFAULT FALSE,
    late_minutes INT DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (outpass_id) REFERENCES outpass_requests(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (security_id) REFERENCES users(id)
);

-- ============================================================
-- LATE ENTRY RECORDS
-- ============================================================
CREATE TABLE late_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    outpass_id BIGINT NOT NULL,
    scan_id BIGINT NOT NULL,
    expected_return DATETIME NOT NULL,
    actual_return DATETIME NOT NULL,
    late_minutes INT NOT NULL,
    action_taken ENUM('WARNING','PARENT_NOTIFIED','FINE','NONE') DEFAULT 'NONE',
    warden_remarks TEXT,
    action_at TIMESTAMP,
    acted_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (outpass_id) REFERENCES outpass_requests(id),
    FOREIGN KEY (scan_id) REFERENCES gate_scans(id),
    FOREIGN KEY (acted_by) REFERENCES users(id)
);

-- ============================================================
-- HOSTEL RULES
-- ============================================================
CREATE TABLE hostel_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('GENERAL','CURFEW','VISITOR','ROOM','DISCIPLINE','SAFETY') NOT NULL,
    severity ENUM('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
    penalty TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('LEAVE','OD','OUTPASS','SYSTEM','LATE_ENTRY','GENERAL') DEFAULT 'GENERAL',
    reference_id BIGINT COMMENT 'ID of the related request',
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- WHATSAPP LOGS
-- ============================================================
CREATE TABLE whatsapp_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    reference_id BIGINT,
    reference_type VARCHAR(50),
    status ENUM('SENT','FAILED','PENDING') DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(200) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO departments (name, code) VALUES
('Computer Science and Engineering', 'CSE'),
('Electronics and Communication Engineering', 'ECE'),
('Mechanical Engineering', 'MECH'),
('Civil Engineering', 'CIVIL'),
('Information Technology', 'IT');

INSERT INTO semesters (name, start_date, end_date, is_active, default_leave_limit, academic_year) VALUES
('Even Semester 2025-26', '2026-01-01', '2026-05-31', TRUE, 20, '2025-26');

-- Default admin/principal user (password: Admin@123)
INSERT INTO users (email, password, name, phone, role, is_first_login) VALUES
('principal@college.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeDRDaP5rlD.oIfJFkT2N7jYy', 'Dr. S. Rajkumar', '9876543210', 'PRINCIPAL', FALSE),
('ao@college.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeDRDaP5rlD.oIfJFkT2N7jYy', 'Mr. K. Anand', '9876543211', 'AO', FALSE),
('warden.boys@college.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeDRDaP5rlD.oIfJFkT2N7jYy', 'Mr. R. Senthil', '9876543212', 'WARDEN', FALSE),
('security@college.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeDRDaP5rlD.oIfJFkT2N7jYy', 'Mr. P. Kumar', '9876543213', 'SECURITY', FALSE);
