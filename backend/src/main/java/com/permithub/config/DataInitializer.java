package com.permithub.config;

import com.permithub.entity.*;
import com.permithub.enums.*;
import com.permithub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Seeds the database with default data on every startup.
 * Safe to run multiple times — uses findOrCreate pattern.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepo;
    private final DepartmentRepository deptRepo;
    private final SemesterRepository semRepo;
    private final FacultyDetailsRepository facultyRepo;
    private final StudentRepository studentRepo;
    private final LeaveBalanceRepository leaveBalanceRepo;

    private final PasswordEncoder encoder;

    private static final String PW = "Admin@123";

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Always fix passwords for any existing users
        fixExistingUsers();

        log.info("Starting DataInitializer — Syncing data with system records...");
        seedAll();
        log.info("✅ Data sync complete. All system users/students are up to date.");
    }

    private void fixExistingUsers() {
        String hash = encoder.encode(PW);
        userRepo.findAll().forEach(u -> {
            if (u.getIsActive() == null)
                u.setIsActive(true);
            if (u.getIsFirstLogin() == null)
                u.setIsFirstLogin(false);
            u.setPassword(hash);
            userRepo.save(u);
        });
        log.info("✅ Fixed passwords for {} users → Admin@123", userRepo.count());
    }

    private String h() {
        return encoder.encode(PW);
    }

    @Transactional
    public void seedAll() {
        // ── DEPARTMENTS ──────────────────────────────────────
        Department cse = dept("Computer Science and Engineering", "CSE");
        Department ece = dept("Electronics and Communication Engineering", "ECE");
        Department mech = dept("Mechanical Engineering", "MECH");
        dept("Civil Engineering", "CIVIL");
        dept("Information Technology", "IT");

        // ── SEMESTER ─────────────────────────────────────────
        Semester sem = sem("Even Semester 2025-26", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 5, 31));

        // ── ADMIN USERS ──────────────────────────────────────
        User principal = user("Dr. S. Rajkumar", "principal@college.edu", Role.PRINCIPAL, null, "9876500001");
        User ao = user("Mr. K. Anand", "ao@college.edu", Role.AO, null, "9876500002");
        User warden = user("Mr. R. Senthil", "warden@college.edu", Role.WARDEN, null, "9876500003");
        User security = user("Mr. P. Kumar", "security@college.edu", Role.SECURITY, null, "9876500004");

        // ── HODs ─────────────────────────────────────────────
        User hodCse = user("Dr. A. Krishnamurthy", "hod.cse@college.edu", Role.HOD, cse, "9876500005");
        User hodEce = user("Dr. B. Suresh", "hod.ece@college.edu", Role.HOD, ece, "9876500006");
        User hodMech = user("Dr. C. Murugan", "hod.mech@college.edu", Role.HOD, mech, "9876500007");

        // ── CSE FACULTY ──────────────────────────────────────
        User fPriya = user("Mrs. Priya Devi", "faculty.priya@college.edu", Role.FACULTY, cse, "9876500008");
        User fRajan = user("Mr. Rajan Kumar", "faculty.rajan@college.edu", Role.FACULTY, cse, "9876500009");
        User fMeena = user("Mrs. Meena Lakshmi", "faculty.meena@college.edu", Role.FACULTY, cse, "9876500010");
        User fSiva = user("Mr. Sivakumar Raja", "faculty.siva@college.edu", Role.FACULTY, cse, "9876500011");
        User fKavitha = user("Mrs. Kavitha Selvi", "faculty.kavitha@college.edu", Role.FACULTY, cse, "9876500012");
        User fMuthu = user("Mr. Muthukumar S", "faculty.muthu@college.edu", Role.FACULTY, cse, "9876500013");

        // ── ECE FACULTY ──────────────────────────────────────
        User fGanesh = user("Mr. Ganesh Raj", "faculty.ganesh@college.edu", Role.FACULTY, ece, "9876500014");
        User fValli = user("Mrs. Valli Devi", "faculty.valli@college.edu", Role.FACULTY, ece, "9876500015");
        User fKumarE = user("Mr. Kumar Periasamy", "faculty.kumar.ece@college.edu", Role.FACULTY, ece, "9876500016");
        User fSumathi = user("Mrs. Sumathi Rajan", "faculty.sumathi@college.edu", Role.FACULTY, ece, "9876500017");
        User fBabu = user("Mr. Babu Shankar", "faculty.babu.ece@college.edu", Role.FACULTY, ece, "9876500018");
        User fIndira = user("Mrs. Indira Devi", "faculty.indira@college.edu", Role.FACULTY, ece, "9876500019");

        // ── MECH FACULTY ─────────────────────────────────────
        User fVel = user("Mr. Vel Murugan", "faculty.vel@college.edu", Role.FACULTY, mech, "9876500020");
        User fRajaMech = user("Mr. Raja Pandian", "faculty.raja.mech@college.edu", Role.FACULTY, mech, "9876500021");
        User fNirmala = user("Mrs. Nirmala Devi", "faculty.nirmala@college.edu", Role.FACULTY, mech, "9876500022");
        User fKarMech = user("Mr. Karthik Vel", "faculty.karthik.mech@college.edu", Role.FACULTY, mech, "9876500023");
        User fSelvi = user("Mrs. Selvi Anand", "faculty.selvi@college.edu", Role.FACULTY, mech, "9876500024");
        User fPrakashM = user("Mr. Prakash Nathan", "faculty.prakash.mech@college.edu", Role.FACULTY, mech,
                "9876500025");

        // ── FACULTY DETAILS ──────────────────────────────────
        // CSE: Priya=mentor, Rajan=mentor+advisor(3A), Meena=advisor(3B)+mentor
        // CSE Faculty roles:
        // Priya = mentor only
        // Rajan = mentor + class advisor (CS3A)
        // Meena = mentor + class advisor (CS3B) + event coordinator (SYMPOSIUM) ←
        // mentor+advisor+coord
        // Siva = mentor + event coordinator (HACKATHON) ← mentor+coord
        // Kavitha= mentor + event coordinator (INTERNSHIP) ← mentor+coord
        // Muthu = mentor + class advisor (CS2A) + event coordinator (CLUB) ←
        // mentor+advisor+coord
        FacultyDetails fdPriya = fd(fPriya, "CSE001", "Associate Professor", true, false, false, null, null, null,
                null);
        FacultyDetails fdRajan = fd(fRajan, "CSE002", "Associate Professor", true, true, false, 3, "A", cse, null);
        FacultyDetails fdMeena = fd(fMeena, "CSE003", "Assistant Professor", true, true, true, 3, "B", cse,
                "[\"SYMPOSIUM\",\"CONFERENCE\"]");
        FacultyDetails fdSiva = fd(fSiva, "CSE004", "Assistant Professor", true, false, true, null, null, null,
                "[\"HACKATHON\"]");
        FacultyDetails fdKavitha = fd(fKavitha, "CSE005", "Assistant Professor", true, false, true, null, null, null,
                "[\"INTERNSHIP\"]");
        FacultyDetails fdMuthu = fd(fMuthu, "CSE006", "Assistant Professor", true, true, true, 2, "A", cse,
                "[\"CLUB_ACTIVITIES\",\"CULTURAL\"]");

        // ECE Faculty roles:
        // Ganesh = mentor + class advisor (EC3A)
        // Valli = mentor only
        // KumarE = mentor + class advisor (EC2A) + event coord (SYMPOSIUM) ←
        // mentor+advisor+coord
        // Sumathi= mentor + event coord (HACKATHON) ← mentor+coord
        // Babu = mentor + event coord (INTERNSHIP) ← mentor+coord
        // Indira = mentor + class advisor (EC3B) + event coord (CLUB) ←
        // mentor+advisor+coord
        FacultyDetails fdGanesh = fd(fGanesh, "ECE001", "Associate Professor", true, true, false, 3, "A", ece, null);
        FacultyDetails fdValli = fd(fValli, "ECE002", "Associate Professor", true, false, false, null, null, null,
                null);
        FacultyDetails fdKumarE = fd(fKumarE, "ECE003", "Assistant Professor", true, true, true, 2, "A", ece,
                "[\"SYMPOSIUM\",\"CONFERENCE\"]");
        FacultyDetails fdSumathi = fd(fSumathi, "ECE004", "Assistant Professor", true, false, true, null, null, null,
                "[\"HACKATHON\",\"WORKSHOP\"]");
        FacultyDetails fdBabu = fd(fBabu, "ECE005", "Assistant Professor", true, false, true, null, null, null,
                "[\"INTERNSHIP\"]");
        FacultyDetails fdIndira = fd(fIndira, "ECE006", "Assistant Professor", true, true, true, 3, "B", ece,
                "[\"CLUB_ACTIVITIES\",\"SPORTS\"]");

        // MECH Faculty roles:
        // Vel = mentor + class advisor (ME3A)
        // Raja = mentor only
        // Nirmala = mentor + class advisor (ME2A) + event coord (SYMPOSIUM) ←
        // mentor+advisor+coord
        // KarMech = mentor + event coord (HACKATHON) ← mentor+coord
        // Selvi = mentor + event coord (INTERNSHIP) ← mentor+coord
        // PrakashM= mentor + class advisor (ME3B) + event coord (CLUB) ←
        // mentor+advisor+coord
        FacultyDetails fdVel = fd(fVel, "MECH001", "Associate Professor", true, true, false, 3, "A", mech, null);
        FacultyDetails fdRajaMech = fd(fRajaMech, "MECH002", "Associate Professor", true, false, false, null, null,
                null, null);
        FacultyDetails fdNirmala = fd(fNirmala, "MECH003", "Assistant Professor", true, true, true, 2, "A", mech,
                "[\"SYMPOSIUM\",\"CONFERENCE\"]");
        FacultyDetails fdKarMech = fd(fKarMech, "MECH004", "Assistant Professor", true, false, true, null, null, null,
                "[\"HACKATHON\"]");
        FacultyDetails fdSelvi = fd(fSelvi, "MECH005", "Assistant Professor", true, false, true, null, null, null,
                "[\"INTERNSHIP\"]");
        FacultyDetails fdPrakashM = fd(fPrakashM, "MECH006", "Assistant Professor", true, true, true, 3, "B", mech,
                "[\"CLUB_ACTIVITIES\",\"SPORTS\"]");

        // ── STUDENTS ─────────────────────────────────────────
        // CSE 3rd Year A — mentor=Priya, advisor=Rajan
        Student s1 = student("Arjun Sharma", "student.arjun@college.edu", "711521CS001", "CS3A01", 3, "A", cse, sem,
                fdPriya, fdRajan, true, "Saraswathi Hostel", "A-101", "Ramesh Sharma", "6379890965", "B+");
        Student s2 = student("Divya Nair", "student.divya@college.edu", "711521CS002", "CS3A02", 3, "A", cse, sem,
                fdPriya, fdRajan, false, null, null, "Suresh Nair", "9845100002", "O+");
        Student s3 = student("Karthik Rajan", "student.karthik@college.edu", "711521CS003", "CS3A03", 3, "A", cse, sem,
                fdPriya, fdRajan, true, "Saraswathi Hostel", "A-102", "Prakash Rajan", "9845100003", "A+");
        Student s4 = student("Sneha Balaji", "student.sneha@college.edu", "711521CS004", "CS3A04", 3, "A", cse, sem,
                fdPriya, fdRajan, false, null, null, "Balaji Kumar", "9845100004", "AB+");
        Student s5 = student("Vikram Reddy", "student.vikram@college.edu", "711521CS005", "CS3A05", 3, "A", cse, sem,
                fdPriya, fdRajan, true, "Saraswathi Hostel", "B-201", "Reddy Venkat", "9845100005", "O-");
        // CSE 3rd Year B — mentor=Rajan, advisor=Meena
        Student s6 = student("Pooja Venkat", "student.pooja@college.edu", "711521CS021", "CS3B01", 3, "B", cse, sem,
                fdRajan, fdMeena, false, null, null, "Venkat Pillai", "9845100006", "B-");
        Student s7 = student("Rahul Mehta", "student.rahul@college.edu", "711521CS022", "CS3B02", 3, "B", cse, sem,
                fdRajan, fdMeena, true, "Krishna Hostel", "C-301", "Sunil Mehta", "9845100007", "A-");
        Student s8 = student("Ananya Pillai", "student.ananya@college.edu", "711521CS023", "CS3B03", 3, "B", cse, sem,
                fdRajan, fdMeena, false, null, null, "Ravi Pillai", "9845100008", "B+");
        Student s9 = student("Sathish Kumar", "student.sathish@college.edu", "711521CS024", "CS3B04", 3, "B", cse, sem,
                fdRajan, fdMeena, true, "Saraswathi Hostel", "B-301", "Kumar Sathish", "9845100009", "O+");
        Student s10 = student("Preethi Raj", "student.preethi@college.edu", "711521CS025", "CS3B05", 3, "B", cse, sem,
                fdRajan, fdMeena, false, null, null, "Raj Preethi", "9845100010", "A+");
        // CSE 2nd Year A — mentor=Meena, advisor=Meena
        Student s11 = student("Arun Vijay", "student.arun@college.edu", "711522CS001", "CS2A01", 2, "A", cse, sem,
                fdMeena, fdMeena, true, "Krishna Hostel", "D-101", "Vijay Arun", "9845100011", "B+");
        Student s12 = student("Pavithra Suresh", "student.pavithra@college.edu", "711522CS002", "CS2A02", 2, "A", cse,
                sem, fdMeena, fdMeena, false, null, null, "Suresh Pavithra", "9845100012", "O+");
        // ECE 3rd Year A — mentor=Ganesh, advisor=Ganesh (same person)
        Student s13 = student("Krishna Iyer", "student.krishna@college.edu", "711521EC001", "EC3A01", 3, "A", ece, sem,
                fdGanesh, fdGanesh, true, "Saraswathi Hostel", "D-201", "Srinivas Iyer", "9845100013", "O+");
        Student s14 = student("Lavanya Suresh", "student.lavanya@college.edu", "711521EC002", "EC3A02", 3, "A", ece,
                sem, fdGanesh, fdGanesh, false, null, null, "Ramesh Suresh", "9845100014", "A+");
        Student s15 = student("Bala Murugan", "student.bala@college.edu", "711521EC003", "EC3A03", 3, "A", ece, sem,
                fdGanesh, fdGanesh, true, "Krishna Hostel", "E-101", "Murugan Bala", "9845100015", "B+");
        Student s16 = student("Keerthana Devi", "student.keerthana@college.edu", "711521EC004", "EC3A04", 3, "A", ece,
                sem, fdGanesh, fdGanesh, false, null, null, "Rajan Keerthi", "9845100016", "AB+");
        // MECH 3rd Year A — mentor=Vel, advisor=Vel (same person)
        Student s17 = student("Surya Prakash", "student.surya@college.edu", "711521ME001", "ME3A01", 3, "A", mech, sem,
                fdVel, fdVel, true, "Krishna Hostel", "F-101", "Prakash Surya", "9845100017", "B+");
        Student s18 = student("Tamil Selvan", "student.tamil@college.edu", "711521ME002", "ME3A02", 3, "A", mech, sem,
                fdVel, fdVel, false, null, null, "Selvan Tamil", "9845100018", "O+");
        Student s19 = student("Mani Bharathi", "student.mani@college.edu", "711521ME003", "ME3A03", 3, "A", mech, sem,
                fdVel, fdVel, true, "Saraswathi Hostel", "G-101", "Bharathi Mani", "9845100019", "A-");
        Student s20 = student("Chithra Lakshmi", "student.chithra@college.edu", "711521ME004", "ME3A04", 3, "A", mech,
                sem, fdVel, fdVel, false, null, null, "Lakshmi Chitra", "9845100020", "O+");

        // ── LEAVE BALANCES ───────────────────────────────────
        List.of(s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20)
                .forEach(s -> lb(s, sem, 20, 0));

        log.info("✅ Seeded: 5 depts, 1 semester, 7 admins/HODs, 18 faculty, 20 students, 20 leave balances");
    }

    // ── Helpers ──────────────────────────────────────────────
    private Department dept(String name, String code) {
        return deptRepo.findByCode(code)
                .orElseGet(() -> deptRepo.save(Department.builder().name(name).code(code).build()));
    }

    private Semester sem(String name, LocalDate start, LocalDate end) {
        return semRepo.findByIsActiveTrue()
                .orElseGet(() -> semRepo.save(Semester.builder().name(name).startDate(start).endDate(end)
                        .isActive(true).defaultLeaveLimit(20).academicYear("2025-26").build()));
    }

    private User user(String name, String email, Role role, Department dept, String phone) {
        User u = userRepo.findByEmail(email).orElse(new User());
        u.setName(name);
        u.setEmail(email);
        if (u.getPassword() == null)
            u.setPassword(h());
        u.setPhone(phone);
        u.setRole(role);
        u.setDepartment(dept);
        u.setIsActive(true);
        u.setIsFirstLogin(false);
        return userRepo.save(u);
    }

    private FacultyDetails fd(User user, String empId, String designation,
            boolean mentor, boolean advisor, boolean coordinator,
            Integer advisorYear, String advisorSection,
            Department advisorDept, String eventTypes) {
        return facultyRepo.findByUserId(user.getId()).orElseGet(() -> facultyRepo.save(FacultyDetails.builder()
                .user(user).employeeId(empId).designation(designation)
                .isMentor(mentor).isClassAdvisor(advisor).isEventCoordinator(coordinator)
                .advisorYear(advisorYear).advisorSection(advisorSection)
                .advisorDepartment(advisorDept).eventTypes(eventTypes).build()));
    }

    private Student student(String name, String email, String regNo, String rollNo,
            int year, String section, Department dept, Semester sem,
            FacultyDetails mentor, FacultyDetails advisor,
            boolean hosteler, String hostelName, String roomNo,
            String parentName, String parentPhone, String bloodGroup) {
        // Use a derived student phone (parent phone + 1 digit offset for uniqueness)
        String studentPhone = parentPhone; // same as parent for simplicity
        User u = user(name, email, Role.STUDENT, dept, studentPhone);

        Student s = studentRepo.findByUserId(u.getId()).orElse(new Student());
        s.setUser(u);
        s.setRegisterNumber(regNo);
        s.setRollNumber(rollNo);
        s.setYear(year);
        s.setSection(section);
        s.setDepartment(dept);
        s.setSemester(sem);
        s.setCurrentMentor(mentor);
        s.setClassAdvisor(advisor);
        s.setIsHosteler(hosteler);
        s.setHostelName(hostelName);
        s.setRoomNumber(roomNo);
        s.setParentName(parentName);
        s.setParentPhone(parentPhone);
        s.setParentWhatsapp(parentPhone);
        s.setBloodGroup(bloodGroup);
        return studentRepo.save(s);
    }

    private void lb(Student s, Semester sem, int total, int used) {
        leaveBalanceRepo.findByStudentIdAndSemesterId(s.getId(), sem.getId())
                .orElseGet(() -> leaveBalanceRepo.save(
                        LeaveBalance.builder().student(s).semester(sem)
                                .totalLeaves(total).usedLeaves(used).build()));
    }
}
