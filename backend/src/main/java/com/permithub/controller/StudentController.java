package com.permithub.controller;

import com.permithub.dto.response.*;
import com.permithub.entity.Student;
import com.permithub.entity.User;
import com.permithub.exception.ResourceNotFoundException;
import com.permithub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentController {

    private final UserRepository userRepo;
    private final StudentRepository studentRepo;
    private final LeaveBalanceRepository leaveBalanceRepo;
    private final SemesterRepository semesterRepo;
    private final LeaveRequestRepository leaveRepo;
    private final OdRequestRepository odRepo;
    private final OutpassRequestRepository outpassRepo;

    private User currentUser(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<StudentResponse>> profile(@AuthenticationPrincipal UserDetails ud) {
        User u = currentUser(ud);
        Student s = studentRepo.findByUserId(u.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
        var sem = semesterRepo.findByIsActiveTrue().orElse(null);
        var lb = sem != null ? leaveBalanceRepo.findByStudentIdAndSemesterId(s.getId(), sem.getId()).orElse(null) : null;

        StudentResponse resp = StudentResponse.builder()
                .id(s.getId()).userId(u.getId()).name(u.getName()).email(u.getEmail()).phone(u.getPhone())
                .registerNumber(s.getRegisterNumber()).rollNumber(s.getRollNumber())
                .year(s.getYear()).section(s.getSection())
                .departmentName(s.getDepartment().getName()).departmentCode(s.getDepartment().getCode())
                .mentorName(s.getCurrentMentor() != null ? s.getCurrentMentor().getUser().getName() : null)
                .advisorName(s.getClassAdvisor() != null ? s.getClassAdvisor().getUser().getName() : null)
                .isHosteler(s.getIsHosteler()).hostelName(s.getHostelName()).roomNumber(s.getRoomNumber())
                .parentName(s.getParentName()).parentPhone(s.getParentPhone())
                .parentWhatsapp(s.getParentWhatsapp()).bloodGroup(s.getBloodGroup())
                .profilePic(u.getProfilePic())
                .leaveBalance(lb != null ? lb.getRemainingLeaves() : null)
                .usedLeaves(lb != null ? lb.getUsedLeaves() : null)
                .createdAt(s.getCreatedAt()).build();
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> dashboard(@AuthenticationPrincipal UserDetails ud) {
        User u = currentUser(ud);
        Student s = studentRepo.findByUserId(u.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        var sem = semesterRepo.findByIsActiveTrue().orElse(null);
        var lb = sem != null ? leaveBalanceRepo.findByStudentIdAndSemesterId(s.getId(),
                sem.getId()).orElse(null) : null;

        long pendLeave = leaveRepo.findByStudentIdAndStatus(s.getId(),
                com.permithub.enums.LeaveStatus.PENDING).size();
        long pendOd = odRepo.findByStudentIdAndStatus(s.getId(),
                com.permithub.enums.OdStatus.PENDING).size();
        long pendOut = outpassRepo.findByStudentIdOrderByCreatedAtDesc(s.getId()).stream()
                .filter(o -> o.getStatus() == com.permithub.enums.OutpassStatus.PENDING).count();

        return ResponseEntity.ok(ApiResponse.ok(DashboardStatsResponse.builder()
                .pendingLeaves(pendLeave).pendingOds(pendOd).pendingOutpasses(pendOut)
                .leaveBalance(lb != null ? lb.getRemainingLeaves() : 20)
                .usedLeaves(lb != null ? lb.getUsedLeaves() : 0).build()));
    }

    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody Map<String, String> updates) {
        User u = currentUser(ud);
        if (updates.containsKey("phone")) u.setPhone(updates.get("phone"));
        if (updates.containsKey("name")) u.setName(updates.get("name"));
        userRepo.save(u);
        Student s = studentRepo.findByUserId(u.getId()).orElse(null);
        if (s != null) {
            if (updates.containsKey("address")) s.setAddress(updates.get("address"));
            if (updates.containsKey("emergencyContact")) s.setParentPhone(updates.get("emergencyContact"));
            studentRepo.save(s);
        }
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", null));
    }
}
