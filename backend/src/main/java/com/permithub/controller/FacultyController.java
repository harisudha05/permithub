package com.permithub.controller;

import com.permithub.dto.request.*;
import com.permithub.dto.response.*;
import com.permithub.entity.*;
import com.permithub.enums.*;
import com.permithub.exception.*;
import com.permithub.repository.*;
import com.permithub.service.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/faculty")
@RequiredArgsConstructor
public class FacultyController {

    private final UserRepository userRepo;
    private final StudentRepository studentRepo;
    private final FacultyDetailsRepository facultyRepo;
    private final LeaveRequestRepository leaveRepo;
    private final OdRequestRepository odRepo;
    private final OutpassRequestRepository outpassRepo;
    private final SemesterRepository semesterRepo;
    private final LeaveBalanceRepository leaveBalanceRepo;
    private final DepartmentRepository deptRepo;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final NotificationService notifService;
    private final LeaveService leaveService;
    private final OdService odService;

    private User currentUser(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private FacultyDetails currentFaculty(UserDetails ud) {
        return facultyRepo.findByUserId(currentUser(ud).getId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty details not found"));
    }

    // ── DASHBOARD ──────────────────────────────────────────
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> dashboard(@AuthenticationPrincipal UserDetails ud) {
        FacultyDetails f = currentFaculty(ud);
        long menteeCount = studentRepo.findByCurrentMentorId(f.getId()).size();
        long pendingLeaves = leaveRepo.findByMentorIdAndMentorStatus(f.getId(), ApprovalStatus.PENDING).size();
        long pendingOds = odRepo.findByMentorIdAndMentorStatus(f.getId(), ApprovalStatus.PENDING).size();
        long pendingOutpasses = outpassRepo.findByMentorIdAndMentorStatus(f.getId(), ApprovalStatus.PENDING).size();
        return ResponseEntity.ok(ApiResponse.ok(DashboardStatsResponse.builder()
                .totalMentees(menteeCount).pendingLeaves(pendingLeaves)
                .pendingOds(pendingOds).pendingOutpasses(pendingOutpasses).build()));
    }

    // ── PROFILE ─────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> profile(@AuthenticationPrincipal UserDetails ud) {
        User u = currentUser(ud); FacultyDetails f = currentFaculty(ud);
        Map<String, Object> data = new HashMap<>();
        data.put("id", u.getId()); data.put("name", u.getName());
        data.put("email", u.getEmail()); data.put("phone", u.getPhone());
        data.put("isMentor", f.getIsMentor()); data.put("isClassAdvisor", f.getIsClassAdvisor());
        data.put("isEventCoordinator", f.getIsEventCoordinator());
        data.put("advisorYear", f.getAdvisorYear()); data.put("advisorSection", f.getAdvisorSection());
        data.put("department", u.getDepartment() != null ? u.getDepartment().getName() : null);
        data.put("eventTypes", f.getEventTypes());
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    // ── MENTEES ─────────────────────────────────────────────
    @GetMapping("/mentees")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<StudentResponse>>> myMentees(@AuthenticationPrincipal UserDetails ud) {
        FacultyDetails f = currentFaculty(ud);
        List<StudentResponse> list = studentRepo.findByCurrentMentorId(f.getId())
                .stream().map(this::mapStudent).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/mentees/leaves")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> menteesLeaves(@AuthenticationPrincipal UserDetails ud) {
        FacultyDetails f = currentFaculty(ud);
        List<Long> ids = studentRepo.findByCurrentMentorId(f.getId()).stream().map(Student::getId).collect(Collectors.toList());
        if (ids.isEmpty()) return ResponseEntity.ok(ApiResponse.ok(List.of()));
        List<LeaveResponse> leaves = leaveRepo.findByStudentIdInOrderByCreatedAtDesc(ids).stream()
                .map(leaveService::mapToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(leaves));
    }

    @GetMapping("/mentees/ods")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<OdResponse>>> menteesOds(@AuthenticationPrincipal UserDetails ud) {
        FacultyDetails f = currentFaculty(ud);
        List<Long> ids = studentRepo.findByCurrentMentorId(f.getId()).stream().map(Student::getId).collect(Collectors.toList());
        if (ids.isEmpty()) return ResponseEntity.ok(ApiResponse.ok(List.of()));
        List<OdResponse> ods = odRepo.findByStudentIdInOrderByCreatedAtDesc(ids).stream()
                .map(odService::mapToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(ods));
    }

    @GetMapping("/mentees/outpasses")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<OutpassResponse>>> menteesOutpasses(@AuthenticationPrincipal UserDetails ud) {
        FacultyDetails f = currentFaculty(ud);
        List<Long> ids = studentRepo.findByCurrentMentorId(f.getId()).stream().map(Student::getId).collect(Collectors.toList());
        if (ids.isEmpty()) return ResponseEntity.ok(ApiResponse.ok(List.of()));
        List<OutpassResponse> outpasses = outpassRepo.findByStudentIdInOrderByCreatedAtDesc(ids).stream()
                .map(this::mapOutpass).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(outpasses));
    }

    // ── MY CLASS ────────────────────────────────────────────
    @GetMapping("/class/students")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<StudentResponse>>> classStudents(@AuthenticationPrincipal UserDetails ud) {
        FacultyDetails f = currentFaculty(ud);
        if (!Boolean.TRUE.equals(f.getIsClassAdvisor())) throw new BadRequestException("You are not a class advisor");
        Long deptId = f.getAdvisorDepartment() != null ? f.getAdvisorDepartment().getId() : 0L;
        List<StudentResponse> list = studentRepo.findByDepartmentIdAndYearAndSection(
                deptId, f.getAdvisorYear(), f.getAdvisorSection())
                .stream().map(this::mapStudent).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/class/leaves")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> classLeaves(@AuthenticationPrincipal UserDetails ud) {
        FacultyDetails f = currentFaculty(ud);
        if (!Boolean.TRUE.equals(f.getIsClassAdvisor())) throw new BadRequestException("You are not a class advisor");
        Long deptId = f.getAdvisorDepartment() != null ? f.getAdvisorDepartment().getId() : 0L;
        List<Long> sids = studentRepo.findByDepartmentIdAndYearAndSection(deptId, f.getAdvisorYear(), f.getAdvisorSection())
                .stream().map(Student::getId).collect(Collectors.toList());
        if (sids.isEmpty()) return ResponseEntity.ok(ApiResponse.ok(List.of()));
        List<LeaveResponse> leaves = leaveRepo.findByStudentIdInOrderByCreatedAtDesc(sids).stream()
                .map(leaveService::mapToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(leaves));
    }

    @GetMapping("/class/ods")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<OdResponse>>> classOds(@AuthenticationPrincipal UserDetails ud) {
        FacultyDetails f = currentFaculty(ud);
        if (!Boolean.TRUE.equals(f.getIsClassAdvisor())) throw new BadRequestException("You are not a class advisor");
        Long deptId = f.getAdvisorDepartment() != null ? f.getAdvisorDepartment().getId() : 0L;
        List<Long> sids = studentRepo.findByDepartmentIdAndYearAndSection(deptId, f.getAdvisorYear(), f.getAdvisorSection())
                .stream().map(Student::getId).collect(Collectors.toList());
        if (sids.isEmpty()) return ResponseEntity.ok(ApiResponse.ok(List.of()));
        List<OdResponse> ods = odRepo.findByStudentIdInOrderByCreatedAtDesc(sids).stream()
                .map(odService::mapToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(ods));
    }

    // ── ADD SINGLE STUDENT ──────────────────────────────────
    @PostMapping("/class/students/single")
    public ResponseEntity<ApiResponse<StudentResponse>> addSingleStudent(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody Map<String, String> body) {
        FacultyDetails f = currentFaculty(ud);
        if (!Boolean.TRUE.equals(f.getIsClassAdvisor())) throw new BadRequestException("Only class advisors can add students");

        String email = body.get("email");
        if (userRepo.existsByEmail(email)) throw new BadRequestException("Email already exists: " + email);

        Semester semester = semesterRepo.findByIsActiveTrue()
                .orElseThrow(() -> new BadRequestException("No active semester"));

        String tempPass = "Pass@" + body.getOrDefault("registerNumber", "1234").replaceAll("[^0-9]", "").substring(0, Math.min(4, body.getOrDefault("registerNumber","1234").replaceAll("[^0-9]","").length()));

        User u = User.builder()
                .name(body.get("name")).email(email)
                .password(passwordEncoder.encode(tempPass))
                .phone(body.get("phone")).role(Role.STUDENT)
                .department(f.getAdvisorDepartment())
                .isActive(true).isFirstLogin(true).build();
        u = userRepo.save(u);

        Student s = Student.builder()
                .user(u).registerNumber(body.get("registerNumber"))
                .rollNumber(body.get("rollNumber"))
                .year(f.getAdvisorYear()).section(f.getAdvisorSection())
                .department(f.getAdvisorDepartment()).semester(semester)
                .classAdvisor(f)
                .isHosteler("true".equalsIgnoreCase(body.get("isHosteler")))
                .parentName(body.get("parentName"))
                .parentPhone(body.get("parentPhone"))
                .parentEmail(body.get("parentEmail"))
                .parentWhatsapp(body.get("parentWhatsapp"))
                .bloodGroup(body.get("bloodGroup")).build();
        s = studentRepo.save(s);

        LeaveBalance lb = LeaveBalance.builder().student(s).semester(semester)
                .totalLeaves(semester.getDefaultLeaveLimit()).usedLeaves(0).build();
        leaveBalanceRepo.save(lb);

        return ResponseEntity.ok(ApiResponse.ok("Student added. Temp password: " + tempPass, mapStudent(s)));
    }

    // ── BULK STUDENT UPLOAD ─────────────────────────────────
    @PostMapping("/class/students/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadStudents(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam("file") MultipartFile file) throws IOException {
        FacultyDetails f = currentFaculty(ud);
        if (!Boolean.TRUE.equals(f.getIsClassAdvisor())) throw new BadRequestException("Only class advisors can upload students");

        Semester semester = semesterRepo.findByIsActiveTrue()
                .orElseThrow(() -> new BadRequestException("No active semester"));

        List<String> errors = new ArrayList<>();
        int created = 0;

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                try {
                    String email = getCellStr(row, 1);
                    if (email.isBlank()) continue;
                    if (userRepo.existsByEmail(email)) {
                        errors.add("Row " + (i + 1) + ": Email already exists - " + email);
                        continue;
                    }
                    String regNo = getCellStr(row, 2);
                    String tempPass = "Pass@" + regNo.replaceAll("[^0-9]", "").substring(0, Math.min(4, regNo.replaceAll("[^0-9]", "").length()));

                    User u = User.builder()
                            .name(getCellStr(row, 0)).email(email)
                            .password(passwordEncoder.encode(tempPass))
                            .phone(getCellStr(row, 6)).role(Role.STUDENT)
                            .department(f.getAdvisorDepartment()).isActive(true).isFirstLogin(true).build();
                    u = userRepo.save(u);

                    Student s = Student.builder()
                            .user(u).registerNumber(regNo).rollNumber(getCellStr(row, 3))
                            .year(f.getAdvisorYear()).section(f.getAdvisorSection())
                            .department(f.getAdvisorDepartment()).semester(semester)
                            .classAdvisor(f)
                            .isHosteler("true".equalsIgnoreCase(getCellStr(row, 7)))
                            .hostelName(getCellStr(row, 8)).roomNumber(getCellStr(row, 9))
                            .parentName(getCellStr(row, 10)).parentPhone(getCellStr(row, 11))
                            .parentEmail(getCellStr(row, 12)).parentWhatsapp(getCellStr(row, 13))
                            .bloodGroup(getCellStr(row, 14)).build();
                    studentRepo.save(s);

                    LeaveBalance lb = LeaveBalance.builder().student(s).semester(semester)
                            .totalLeaves(semester.getDefaultLeaveLimit()).usedLeaves(0).build();
                    leaveBalanceRepo.save(lb);
                    created++;
                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }
        }
        return ResponseEntity.ok(ApiResponse.ok("Upload complete", Map.of("created", created, "errors", errors)));
    }

    // ── TEMPLATE DOWNLOAD ───────────────────────────────────
    @GetMapping("/templates/students")
    public ResponseEntity<byte[]> studentTemplate() {
        byte[] data = fileStorageService.generateStudentExcelTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=student_upload_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    // ── MENTOR ASSIGNMENT ───────────────────────────────────
    @PostMapping("/mentors/assign")
    public ResponseEntity<ApiResponse<Void>> assignMentor(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody MentorAssignRequest request) {
        FacultyDetails mentor = facultyRepo.findById(request.getMentorFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        request.getStudentIds().forEach(sid -> studentRepo.findById(sid).ifPresent(s -> {
            s.setCurrentMentor(mentor);
            studentRepo.save(s);
        }));
        return ResponseEntity.ok(ApiResponse.ok("Mentor assigned", null));
    }

    // ── HELPERS ─────────────────────────────────────────────
    private StudentResponse mapStudent(Student s) {
        Semester sem = s.getSemester();
        LeaveBalance lb = sem != null ?
                leaveBalanceRepo.findByStudentIdAndSemesterId(s.getId(), sem.getId()).orElse(null) : null;
        return StudentResponse.builder()
                .id(s.getId()).userId(s.getUser().getId())
                .name(s.getUser().getName()).email(s.getUser().getEmail())
                .phone(s.getUser().getPhone()).registerNumber(s.getRegisterNumber())
                .rollNumber(s.getRollNumber()).year(s.getYear()).section(s.getSection())
                .departmentName(s.getDepartment().getName()).departmentCode(s.getDepartment().getCode())
                .mentorName(s.getCurrentMentor() != null ? s.getCurrentMentor().getUser().getName() : null)
                .advisorName(s.getClassAdvisor() != null ? s.getClassAdvisor().getUser().getName() : null)
                .isHosteler(s.getIsHosteler()).hostelName(s.getHostelName()).roomNumber(s.getRoomNumber())
                .parentName(s.getParentName()).parentPhone(s.getParentPhone())
                .bloodGroup(s.getBloodGroup()).profilePic(s.getUser().getProfilePic())
                .leaveBalance(lb != null ? lb.getRemainingLeaves() : null)
                .usedLeaves(lb != null ? lb.getUsedLeaves() : null)
                .createdAt(s.getCreatedAt()).build();
    }

    private OutpassResponse mapOutpass(OutpassRequest o) {
        return OutpassResponse.builder()
                .id(o.getId()).studentId(o.getStudent().getId())
                .studentName(o.getStudent().getUser().getName())
                .registerNumber(o.getStudent().getRegisterNumber())
                .outDatetime(o.getOutDatetime()).returnDatetime(o.getReturnDatetime())
                .durationHours(o.getDurationHours() != null ? o.getDurationHours().doubleValue() : null).destination(o.getDestination())
                .reason(o.getReason()).status(o.getStatus())
                .mentorStatus(o.getMentorStatus())
                .parentStatus(o.getParentStatus())
                .parentRemarks(o.getParentRemarks())
                .parentToken(o.getParentToken())
                .advisorStatus(o.getAdvisorStatus())
                .wardenStatus(o.getWardenStatus())
                .aoStatus(o.getAoStatus())
                .principalStatus(o.getPrincipalStatus())
                .parentPhone(o.getStudent().getParentPhone())
                .parentWhatsapp(o.getStudent().getParentWhatsapp() != null
                        ? o.getStudent().getParentWhatsapp()
                        : o.getStudent().getParentPhone())
                .qrCode(o.getQrCode()).createdAt(o.getCreatedAt()).build();
    }

    private String getCellStr(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }
}
