package com.permithub.controller;

import com.permithub.dto.request.*;
import com.permithub.dto.response.*;
import com.permithub.repository.FacultyDetailsRepository;
import com.permithub.repository.UserRepository;
import com.permithub.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;
    private final UserRepository userRepo;
    private final FacultyDetailsRepository facultyRepo;

    private Long userId(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new com.permithub.exception.ResourceNotFoundException("User not found")).getId();
    }

    private Long facultyId(UserDetails ud) {
        return facultyRepo.findByUserId(userId(ud))
                .orElseThrow(() -> new com.permithub.exception.ResourceNotFoundException("Faculty not found")).getId();
    }

    // ── Student ──────────────────────────────────────────
    @PostMapping("/student/leaves")
    public ResponseEntity<LeaveResponse> apply(
            @AuthenticationPrincipal UserDetails ud,
            @RequestPart("data") LeaveRequestDto req,
            @RequestPart(value = "certificate", required = false) MultipartFile certificate) {
        return ResponseEntity.ok(leaveService.applyLeave(ud.getUsername(), req, certificate));
    }

    @GetMapping("/student/leaves")
    public ResponseEntity<List<LeaveResponse>> myLeaves(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(leaveService.getStudentLeaves(ud.getUsername()));
    }

    @DeleteMapping("/student/leaves/{id}/cancel")
    public ResponseEntity<LeaveResponse> cancel(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(leaveService.cancelLeave(id, ud.getUsername()));
    }

    // ── Faculty/Mentor ────────────────────────────────────
    @GetMapping("/faculty/leaves/mentor/pending")
    public ResponseEntity<List<LeaveResponse>> mentorPending(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(leaveService.getPendingForMentor(facultyId(ud)));
    }

    @PutMapping("/faculty/leaves/{id}/mentor-action")
    public ResponseEntity<LeaveResponse> mentorAction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(leaveService.mentorAction(id, ud.getUsername(), req));
    }

    @GetMapping("/faculty/leaves/advisor/pending")
    public ResponseEntity<List<LeaveResponse>> advisorPending(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(leaveService.getPendingForAdvisor(facultyId(ud)));
    }

    @PutMapping("/faculty/leaves/{id}/advisor-action")
    public ResponseEntity<LeaveResponse> advisorAction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(leaveService.advisorAction(id, userId(ud), req));
    }

    // ── HOD ──────────────────────────────────────────────
    @GetMapping("/hod/leaves/pending")
    public ResponseEntity<List<LeaveResponse>> hodPending(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(leaveService.getPendingForHod(userId(ud)));
    }

    @PutMapping("/hod/leaves/{id}/action")
    public ResponseEntity<LeaveResponse> hodAction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(leaveService.hodAction(id, userId(ud), req));
    }

    @PostMapping("/hod/leaves/{id}/notify-parent")
    public ResponseEntity<ApiResponse<Void>> notifyParent(@PathVariable Long id) {
        leaveService.notifyParent(id);
        return ResponseEntity.ok(ApiResponse.success("Parent notified successfully", null));
    }
}
