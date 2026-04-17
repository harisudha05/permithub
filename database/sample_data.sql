-- ============================================================
-- PermitHub Sample Data
-- Run AFTER schema.sql on a FRESH database
-- NOTE: The backend DataInitializer automatically seeds all users,
--       faculty, students when it starts with an empty DB.
--       This file adds sample requests and notifications.
--
-- IMPORTANT: Run schema.sql first, then start the backend ONCE
-- to let DataInitializer seed users/faculty/students.
-- Then run this file to add sample leave/od/outpass requests.
-- ============================================================

USE permithub;

-- ============================================================
-- SECURITY USER (password: Admin@123)
-- Schema.sql already inserts this, but this is a safe ensure.
-- ============================================================
INSERT IGNORE INTO users (email, password, name, phone, role, is_first_login) VALUES
('security@college.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeDRDaP5rlD.oIfJFkT2N7jYy', 'Mr. P. Kumar', '9876543213', 'SECURITY', FALSE);

-- Fix leave category enum if DB was created with old schema
ALTER TABLE leave_requests 
  MODIFY COLUMN category ENUM('SICK','MEDICAL','EMERGENCY','FAMILY','PERSONAL','OTHER') NOT NULL;

-- ============================================================
-- HOSTEL RULES
-- ============================================================
INSERT IGNORE INTO hostel_rules (title, description, category, severity, penalty, is_active, created_by)
SELECT 'Curfew Timing', 'All students must return to hostel by 9:00 PM on weekdays and 10:00 PM on weekends.',
       'CURFEW', 'HIGH', 'Warning + parent notification; suspension for repeat.', TRUE, u.id
FROM users u WHERE u.role = 'WARDEN' LIMIT 1;

INSERT IGNORE INTO hostel_rules (title, description, category, severity, penalty, is_active, created_by)
SELECT 'Visitor Policy', 'Visitors allowed only in common area between 10 AM - 6 PM.',
       'VISITOR', 'MEDIUM', 'Written warning for unregistered visitors.', TRUE, u.id
FROM users u WHERE u.role = 'WARDEN' LIMIT 1;

INSERT IGNORE INTO hostel_rules (title, description, category, severity, penalty, is_active, created_by)
SELECT 'Room Cleanliness', 'Rooms inspected every Monday morning.',
       'ROOM', 'LOW', 'Fine of Rs. 100 for dirty rooms.', TRUE, u.id
FROM users u WHERE u.role = 'WARDEN' LIMIT 1;

INSERT IGNORE INTO hostel_rules (title, description, category, severity, penalty, is_active, created_by)
SELECT 'No Alcohol/Smoking', 'Strictly prohibited inside hostel premises.',
       'DISCIPLINE', 'HIGH', 'Immediate suspension and parent notification.', TRUE, u.id
FROM users u WHERE u.role = 'WARDEN' LIMIT 1;

-- ============================================================
-- SAMPLE LEAVE REQUESTS
-- (Uses subqueries to find correct student/faculty IDs)
-- ============================================================

-- HOD-approved leave: Arjun (sick)
INSERT INTO leave_requests 
  (student_id, semester_id, category, from_date, to_date, total_days, reason, status,
   mentor_id, mentor_status, mentor_remarks, mentor_action_at,
   advisor_id, advisor_status, advisor_remarks, advisor_action_at,
   hod_id, hod_status, hod_remarks, hod_action_at)
SELECT 
  s.id, sem.id, 'SICK', '2026-02-03', '2026-02-05', 3, 'Fever / Cold', 'HOD_APPROVED',
  fd_mentor.id, 'APPROVED', 'Get well soon', '2026-02-03 10:00:00',
  fd_advisor.id, 'APPROVED', 'Approved', '2026-02-03 12:00:00',
  hod.id, 'APPROVED', 'Approved', '2026-02-03 14:00:00'
FROM students s
JOIN semesters sem ON sem.is_active = 1
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
JOIN users hod ON hod.role = 'HOD' AND hod.department_id = s.department_id
WHERE s.register_number = '711521CS001'
LIMIT 1;

-- Mentor-approved leave: Krishna (emergency - waiting advisor)
INSERT INTO leave_requests
  (student_id, semester_id, category, from_date, to_date, total_days, reason, status,
   mentor_id, mentor_status, mentor_remarks, mentor_action_at,
   advisor_id, advisor_status)
SELECT
  s.id, sem.id, 'EMERGENCY', '2026-03-08', '2026-03-10', 3, 'Family emergency', 'MENTOR_APPROVED',
  fd_mentor.id, 'APPROVED', 'Approved. Take care.', '2026-03-08 08:00:00',
  fd_advisor.id, 'PENDING'
FROM students s
JOIN semesters sem ON sem.is_active = 1
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
WHERE s.register_number = '711521EC001'
LIMIT 1;

-- Pending leave: Divya (family)
INSERT INTO leave_requests
  (student_id, semester_id, category, from_date, to_date, total_days, reason, status,
   mentor_id, mentor_status, advisor_id, advisor_status, hod_status)
SELECT
  s.id, sem.id, 'FAMILY', '2026-03-14', '2026-03-15', 2, 'Wedding', 'PENDING',
  fd_mentor.id, 'PENDING',
  fd_advisor.id, 'PENDING', 'PENDING'
FROM students s
JOIN semesters sem ON sem.is_active = 1
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
WHERE s.register_number = '711521CS002'
LIMIT 1;

-- Pending leave: Sneha (sick)
INSERT INTO leave_requests
  (student_id, semester_id, category, from_date, to_date, total_days, reason, status,
   mentor_id, mentor_status, advisor_id, advisor_status, hod_status)
SELECT
  s.id, sem.id, 'SICK', '2026-03-13', '2026-03-13', 1, 'Stomach illness', 'PENDING',
  fd_mentor.id, 'PENDING',
  fd_advisor.id, 'PENDING', 'PENDING'
FROM students s
JOIN semesters sem ON sem.is_active = 1
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
WHERE s.register_number = '711521CS004'
LIMIT 1;

-- Rejected leave: Pooja (personal)
INSERT INTO leave_requests
  (student_id, semester_id, category, from_date, to_date, total_days, reason, status,
   mentor_id, mentor_status, mentor_remarks, mentor_action_at,
   advisor_id, advisor_status, hod_status, rejected_by, rejection_reason)
SELECT
  s.id, sem.id, 'PERSONAL', '2026-02-20', '2026-02-22', 3, 'Government work', 'REJECTED',
  fd_mentor.id, 'REJECTED', 'Insufficient reason during mid-semester.', '2026-02-20 10:00:00',
  fd_advisor.id, 'PENDING', 'PENDING', 'MENTOR', 'Insufficient reason during mid-semester.'
FROM students s
JOIN semesters sem ON sem.is_active = 1
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
WHERE s.register_number = '711521CS021'
LIMIT 1;

-- ============================================================
-- SAMPLE OD REQUESTS
-- ============================================================

-- HOD-approved OD: Arjun (hackathon)
INSERT INTO od_requests
  (student_id, semester_id, event_type, event_name, organizer, from_date, to_date, total_days,
   location, description, status,
   mentor_id, mentor_status, mentor_remarks, mentor_action_at,
   coordinator_id, coordinator_status, coordinator_action_at,
   advisor_id, advisor_status, advisor_action_at,
   hod_id, hod_status, hod_action_at)
SELECT
  s.id, sem.id, 'HACKATHON', 'Smart India Hackathon 2026', 'AICTE',
  '2026-02-14', '2026-02-16', 3, 'IIT Madras, Chennai', 'National level hackathon', 'HOD_APPROVED',
  fd_mentor.id, 'APPROVED', 'Good initiative', '2026-02-12 10:00:00',
  (SELECT fd.id FROM faculty_details fd WHERE fd.is_event_coordinator = 1 AND JSON_CONTAINS(fd.event_types, '"HACKATHON"') AND fd.user_id IN (SELECT id FROM users WHERE department_id = s.department_id) LIMIT 1),
  'APPROVED', '2026-02-12 14:00:00',
  fd_advisor.id, 'APPROVED', '2026-02-13 10:00:00',
  hod.id, 'APPROVED', '2026-02-13 14:00:00'
FROM students s
JOIN semesters sem ON sem.is_active = 1
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
JOIN users hod ON hod.role = 'HOD' AND hod.department_id = s.department_id
WHERE s.register_number = '711521CS001'
LIMIT 1;

-- Pending OD: Vikram (sports)
INSERT INTO od_requests
  (student_id, semester_id, event_type, event_name, organizer, from_date, to_date, total_days,
   location, description, status,
   mentor_id, mentor_status, coordinator_id, coordinator_status, advisor_id, advisor_status, hod_status)
SELECT
  s.id, sem.id, 'SPORTS', 'Inter-College Cricket Tournament', 'Anna University',
  '2026-03-14', '2026-03-15', 2, 'Nehru Stadium, Chennai', 'University cricket tournament', 'PENDING',
  fd_mentor.id, 'PENDING', NULL, 'PENDING', fd_advisor.id, 'PENDING', 'PENDING'
FROM students s
JOIN semesters sem ON sem.is_active = 1
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
WHERE s.register_number = '711521CS005'
LIMIT 1;

-- ============================================================
-- SAMPLE OUTPASS REQUESTS (hostelers only)
-- ============================================================

-- Fully approved outpass with QR: Arjun
INSERT INTO outpass_requests
  (student_id, out_datetime, return_datetime, duration_hours, destination, reason, status,
   mentor_id, mentor_status, mentor_remarks, mentor_action_at,
   parent_status, parent_action_at,
   advisor_id, advisor_status, advisor_action_at,
   warden_id, warden_status, warden_action_at,
   ao_id, ao_status, ao_action_at,
   principal_id, principal_status, principal_action_at, qr_code)
SELECT
  s.id, '2026-03-15 09:00:00', '2026-03-15 18:00:00', 9.00,
  'Apollo Hospital, Vadapalani', 'Medical appointment', 'PRINCIPAL_APPROVED',
  fd_mentor.id, 'APPROVED', 'Approved', '2026-03-14 18:00:00',
  'APPROVED', '2026-03-14 19:00:00',
  fd_advisor.id, 'APPROVED', '2026-03-14 20:00:00',
  (SELECT id FROM users WHERE role='WARDEN' LIMIT 1), 'APPROVED', '2026-03-14 21:00:00',
  (SELECT id FROM users WHERE role='AO' LIMIT 1), 'APPROVED', '2026-03-14 21:30:00',
  (SELECT id FROM users WHERE role='PRINCIPAL' LIMIT 1), 'APPROVED', '2026-03-14 22:00:00', 'QR-PERMITHUB-001-2026'
FROM students s
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
WHERE s.register_number = '711521CS001'
LIMIT 1;

-- Pending outpass: Karthik
INSERT INTO outpass_requests
  (student_id, out_datetime, return_datetime, duration_hours, destination, reason, status,
   mentor_id, mentor_status, advisor_id, advisor_status,
   warden_id, warden_status, ao_id, ao_status, principal_id, principal_status,
   parent_status)
SELECT
  s.id, '2026-03-22 09:00:00', '2026-03-22 17:00:00', 8.00,
  'Spencer Plaza, Chennai', 'Shopping / Personal errand', 'PENDING',
  fd_mentor.id, 'APPROVED', fd_advisor.id, 'APPROVED',
  (SELECT id FROM users WHERE role='WARDEN' LIMIT 1), 'PENDING',
  (SELECT id FROM users WHERE role='AO' LIMIT 1), 'PENDING',
  (SELECT id FROM users WHERE role='PRINCIPAL' LIMIT 1), 'PENDING', 'APPROVED'
FROM students s
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
WHERE s.register_number = '711521CS003'
LIMIT 1;

-- Pending outpass for AO: Vikram (Warden approved, AO pending)
INSERT INTO outpass_requests
  (student_id, out_datetime, return_datetime, duration_hours, destination, reason, status,
   mentor_id, mentor_status, advisor_id, advisor_status,
   warden_id, warden_status, ao_id, ao_status, principal_id, principal_status,
   parent_status)
SELECT
  s.id, '2026-03-23 09:00:00', '2026-03-23 17:00:00', 8.00,
  'Anna Nagar Market, Chennai', 'Family function', 'WARDEN_APPROVED',
  fd_mentor.id, 'APPROVED', fd_advisor.id, 'APPROVED',
  (SELECT id FROM users WHERE role='WARDEN' LIMIT 1), 'APPROVED',
  (SELECT id FROM users WHERE role='AO' LIMIT 1), 'PENDING',
  (SELECT id FROM users WHERE role='PRINCIPAL' LIMIT 1), 'PENDING', 'APPROVED'
FROM students s
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
WHERE s.register_number = '711521CS005'
LIMIT 1;

-- Pending outpass for Principal: Sneha (AO approved, Principal pending)
INSERT INTO outpass_requests
  (student_id, out_datetime, return_datetime, duration_hours, destination, reason, status,
   mentor_id, mentor_status, advisor_id, advisor_status,
   warden_id, warden_status, ao_id, ao_status, principal_id, principal_status,
   parent_status)
SELECT
  s.id, '2026-03-24 09:00:00', '2026-03-24 17:00:00', 8.00,
  'Government Office, Chennai', 'Bank / Government work', 'AO_APPROVED',
  fd_mentor.id, 'APPROVED', fd_advisor.id, 'APPROVED',
  (SELECT id FROM users WHERE role='WARDEN' LIMIT 1), 'APPROVED',
  (SELECT id FROM users WHERE role='AO' LIMIT 1), 'APPROVED',
  (SELECT id FROM users WHERE role='PRINCIPAL' LIMIT 1), 'PENDING', 'APPROVED'
FROM students s
JOIN faculty_details fd_mentor ON s.current_mentor_id = fd_mentor.id
JOIN faculty_details fd_advisor ON s.class_advisor_id = fd_advisor.id
WHERE s.register_number = '711521CS004'
LIMIT 1;

-- ============================================================
-- UPDATE LEAVE BALANCES for HOD-approved leave
-- ============================================================
UPDATE leave_balances lb
JOIN students s ON lb.student_id = s.id
SET lb.used_leaves = 3
WHERE s.register_number = '711521CS001';

-- ============================================================
-- CREDENTIALS (all passwords: Admin@123)
-- principal@college.edu  | hod.cse@college.edu   | hod.ece@college.edu   | hod.mech@college.edu
-- faculty.priya@college.edu  (CSE mentor - CS3A)
-- faculty.rajan@college.edu  (CSE mentor+advisor CS3A)
-- faculty.meena@college.edu  (CSE mentor+advisor CS3B)
-- faculty.ganesh@college.edu (ECE mentor+advisor EC3A - same person)
-- faculty.vel@college.edu    (MECH mentor+advisor ME3A - same person)
-- student.arjun@college.edu  student.divya@college.edu  student.karthik@college.edu
-- student.sneha@college.edu  student.vikram@college.edu (CSE 3A hostelers marked)
-- student.krishna@college.edu student.surya@college.edu (ECE/MECH)
-- warden@college.edu | ao@college.edu | security@college.edu
-- ============================================================
