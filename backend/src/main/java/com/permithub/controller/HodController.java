package com.permithub.controller;

import com.permithub.dto.request.FacultyUploadDto;
import com.permithub.dto.request.SemesterRequest;
import com.permithub.dto.response.*;
import com.permithub.entity.*;
import com.permithub.enums.Role;
import com.permithub.exception.BadRequestException;
import com.permithub.exception.ResourceNotFoundException;
import com.permithub.repository.*;
import com.permithub.service.FileStorageService;
import jakarta.validation.Valid;
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
@RequestMapping("/hod")
@RequiredArgsConstructor
public class HodController {

    private final UserRepository userRepo;
    private final StudentRepository studentRepo;
    private final FacultyDetailsRepository facultyRepo;
    private final DepartmentRepository deptRepo;
    private final SemesterRepository semesterRepo;
    private final LeaveRequestRepository leaveRepo;
    private final OdRequestRepository odRepo;
    private final OutpassRequestRepository outpassRepo;
    private final LeaveBalanceRepository leaveBalanceRepo;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    private User currentUser(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> dashboard(@AuthenticationPrincipal UserDetails ud) {
        User hod = currentUser(ud);
        Long deptId = hod.getDepartment() != null ? hod.getDepartment().getId() : null;
        long students = deptId != null ? studentRepo.findByDepartmentId(deptId).size() : 0;
        long faculty = deptId != null ? userRepo.findByDepartmentIdAndRole(deptId, Role.FACULTY).size() : 0;
        Long deptIdForLeave = hod.getDepartment() != null ? hod.getDepartment().getId() : -1L;
        long pendLeave = leaveRepo.findPendingForHodByDepartment(deptIdForLeave).size();
        Long deptIdForOd = hod.getDepartment() != null ? hod.getDepartment().getId() : -1L;
        long pendOd = odRepo.findPendingForHodByDepartment(deptIdForOd).size();
        long pendOut = outpassRepo.findByPrincipalIdAndPrincipalStatus(hod.getId(), com.permithub.enums.ApprovalStatus.PENDING).size();

        return ResponseEntity.ok(ApiResponse.ok(DashboardStatsResponse.builder()
                .totalStudents(students).totalFaculty(faculty)
                .pendingLeaves(pendLeave).pendingOds(pendOd).pendingOutpasses(pendOut).build()));
    }

    @GetMapping("/faculty")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFaculty(@AuthenticationPrincipal UserDetails ud) {
        User hod = currentUser(ud);
        Long deptId = hod.getDepartment() != null ? hod.getDepartment().getId() : null;
        List<Map<String, Object>> result = userRepo.findByDepartmentIdAndRole(deptId, Role.FACULTY)
                .stream().map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId()); m.put("name", u.getName()); m.put("email", u.getEmail());
                    facultyRepo.findByUserId(u.getId()).ifPresent(f -> {
                        m.put("isMentor", f.getIsMentor()); m.put("isClassAdvisor", f.getIsClassAdvisor());
                        m.put("isEventCoordinator", f.getIsEventCoordinator());
                        m.put("advisorYear", f.getAdvisorYear()); m.put("advisorSection", f.getAdvisorSection());
                        m.put("employeeId", f.getEmployeeId()); m.put("designation", f.getDesignation());
                        m.put("eventTypes", f.getEventTypes());
                        m.put("userId", u.getId());
                    });
                    return m;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/faculty/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFaculty(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam("file") MultipartFile file) throws IOException {
        User hod = currentUser(ud);
        Department dept = hod.getDepartment();
        List<String> errors = new ArrayList<>();
        int created = 0;

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                try {
                    String email = getCellStr(row, 1);
                    if (userRepo.existsByEmail(email)) { errors.add("Row " + (i+1) + ": email exists"); continue; }
                    User u = User.builder()
                            .name(getCellStr(row, 0)).email(email)
                            .password(passwordEncoder.encode("Faculty@123"))
                            .phone(getCellStr(row, 3)).role(Role.FACULTY)
                            .department(dept).isActive(true).isFirstLogin(true).build();
                    u = userRepo.save(u);
                    FacultyDetails fd = FacultyDetails.builder().user(u)
                            .employeeId(getCellStr(row, 2)).designation(getCellStr(row, 4))
                            .isMentor("true".equalsIgnoreCase(getCellStr(row, 5)))
                            .isClassAdvisor("true".equalsIgnoreCase(getCellStr(row, 6)))
                            .isEventCoordinator("true".equalsIgnoreCase(getCellStr(row, 7)))
                            .advisorDepartment(dept).build();
                    facultyRepo.save(fd);
                    created++;
                } catch (Exception e) { errors.add("Row " + (i+1) + ": " + e.getMessage()); }
            }
        }
        return ResponseEntity.ok(ApiResponse.ok("Upload complete", Map.of("created", created, "errors", errors)));
    }

    @GetMapping("/templates/faculty")
    public ResponseEntity<byte[]> facultyTemplate() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=faculty_upload_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(fileStorageService.generateFacultyExcelTemplate());
    }

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudents(@AuthenticationPrincipal UserDetails ud) {
        User hod = currentUser(ud);
        Long deptId = hod.getDepartment() != null ? hod.getDepartment().getId() : null;
        List<Map<String, Object>> list = studentRepo.findByDepartmentId(deptId).stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId()); m.put("name", s.getUser().getName());
            m.put("email", s.getUser().getEmail()); m.put("registerNumber", s.getRegisterNumber());
            m.put("year", s.getYear()); m.put("section", s.getSection());
            m.put("mentor", s.getCurrentMentor() != null ? s.getCurrentMentor().getUser().getName() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/semesters")
    public ResponseEntity<ApiResponse<Semester>> createSemester(@Valid @RequestBody SemesterRequest req) {
        semesterRepo.findByIsActiveTrue().ifPresent(s -> { s.setIsActive(false); semesterRepo.save(s); });
        Semester sem = Semester.builder()
                .name(req.getName()).startDate(req.getStartDate()).endDate(req.getEndDate())
                .isActive(true).defaultLeaveLimit(req.getDefaultLeaveLimit())
                .academicYear(req.getAcademicYear()).build();
        return ResponseEntity.ok(ApiResponse.ok("Semester created", semesterRepo.save(sem)));
    }

    @GetMapping("/semesters")
    public ResponseEntity<ApiResponse<List<Semester>>> getSemesters() {
        return ResponseEntity.ok(ApiResponse.ok(semesterRepo.findAll()));
    }

    @PostMapping("/faculty/{id}/roles")
    public ResponseEntity<ApiResponse<Void>> updateRoles(
            @PathVariable Long id,
            @RequestBody Map<String, Object> roles) {
        FacultyDetails fd = facultyRepo.findByUserId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        if (roles.containsKey("isMentor")) fd.setIsMentor((Boolean) roles.get("isMentor"));
        if (roles.containsKey("isClassAdvisor")) fd.setIsClassAdvisor((Boolean) roles.get("isClassAdvisor"));
        if (roles.containsKey("isEventCoordinator")) fd.setIsEventCoordinator((Boolean) roles.get("isEventCoordinator"));
        if (roles.containsKey("advisorYear")) {
            Object y = roles.get("advisorYear");
            fd.setAdvisorYear(y != null ? Integer.valueOf(y.toString()) : null);
        }
        if (roles.containsKey("advisorSection")) fd.setAdvisorSection((String) roles.get("advisorSection"));
        if (roles.containsKey("eventTypes")) fd.setEventTypes((String) roles.get("eventTypes"));
        facultyRepo.save(fd);
        return ResponseEntity.ok(ApiResponse.ok("Roles updated", null));
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
