package com.permithub.controller;

import com.permithub.dto.request.*;
import com.permithub.dto.response.*;
import com.permithub.repository.OutpassRequestRepository;
import com.permithub.repository.UserRepository;
import com.permithub.service.OutpassService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class OutpassController {

    private final OutpassService outpassService;
    private final UserRepository userRepo;
    private final OutpassRequestRepository outpassRepo;

    private Long userId(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new com.permithub.exception.ResourceNotFoundException("User not found")).getId();
    }

    @PostMapping("/student/outpass")
    public ResponseEntity<OutpassResponse> apply(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody OutpassRequestDto req) {
        return ResponseEntity.ok(outpassService.applyOutpass(userId(ud), req));
    }

    @GetMapping("/student/outpass")
    public ResponseEntity<List<OutpassResponse>> myOutpasses(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(outpassService.getStudentOutpasses(userId(ud)));
    }

    @PutMapping("/faculty/outpass/{id}/mentor-action")
    public ResponseEntity<OutpassResponse> mentorAction(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud, @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(outpassService.mentorAction(id, userId(ud), req));
    }

    @PutMapping("/faculty/outpass/{id}/advisor-action")
    public ResponseEntity<OutpassResponse> advisorAction(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud, @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(outpassService.advisorAction(id, userId(ud), req));
    }

    @GetMapping("/parent/outpass/{token}")
    public ResponseEntity<OutpassResponse> viewForParent(@PathVariable String token) {
        return ResponseEntity.ok(outpassService.getByParentToken(token));
    }

    @PostMapping("/parent/outpass/{token}/action")
    public ResponseEntity<OutpassResponse> parentAction(
            @PathVariable String token, @RequestBody ParentApprovalRequest req) {
        return ResponseEntity.ok(outpassService.parentAction(token, req));
    }

    @PutMapping("/warden/outpass/{id}/action")
    public ResponseEntity<OutpassResponse> wardenAction(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud, @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(outpassService.wardenAction(id, userId(ud), req));
    }

    @GetMapping("/warden/outpass/pending")
    public ResponseEntity<List<OutpassResponse>> wardenPending(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(outpassService.getPendingForWarden(userId(ud)));
    }

    @GetMapping("/ao/outpass/pending")
    public ResponseEntity<List<OutpassResponse>> aoPending(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(outpassService.getPendingForAo(userId(ud)));
    }

    @GetMapping("/principal/outpass/pending")
    public ResponseEntity<List<OutpassResponse>> principalPending(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(outpassService.getPendingForPrincipal(userId(ud)));
    }

    @PutMapping("/ao/outpass/{id}/action")
    public ResponseEntity<OutpassResponse> aoAction(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud, @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(outpassService.aoAction(id, userId(ud), req));
    }

    @PutMapping("/principal/outpass/{id}/action")
    public ResponseEntity<OutpassResponse> principalAction(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud, @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(outpassService.principalAction(id, userId(ud), req));
    }

    @PostMapping("/security/outpass/scan")
    public ResponseEntity<OutpassResponse> scan(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(outpassService.processQrScan(body.get("qrContent"), userId(ud)));
    }

    /** HOD: View all outpasses for their department (read-only overview) */
    @GetMapping("/hod/outpass")
    public ResponseEntity<ApiResponse<List<OutpassResponse>>> hodOutpass(
            @AuthenticationPrincipal UserDetails ud) {
        Long hodUserId = userId(ud);
        com.permithub.entity.User hod = userRepo.findById(hodUserId)
                .orElseThrow(() -> new com.permithub.exception.ResourceNotFoundException("User", hodUserId));
        Long deptId = hod.getDepartment() != null ? hod.getDepartment().getId() : null;
        if (deptId == null) return ResponseEntity.ok(ApiResponse.ok(java.util.List.of()));
        List<OutpassResponse> result = outpassRepo.findByStudentDepartmentIdOrderByCreatedAtDesc(deptId)
                .stream().map(outpassService::mapToResponse).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** Faculty Mentor: Get pending outpasses assigned to me as mentor */
    @GetMapping("/faculty/outpass/mentor/pending")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<OutpassResponse>>> pendingMentorOutpass(
            @AuthenticationPrincipal UserDetails ud) {
        List<OutpassResponse> result = outpassService.getPendingForMentor(userId(ud));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** Faculty Advisor: Get pending outpasses assigned to me as class advisor */
    @GetMapping("/faculty/outpass/advisor/pending")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<OutpassResponse>>> pendingAdvisorOutpass(
            @AuthenticationPrincipal UserDetails ud) {
        List<OutpassResponse> result = outpassService.getPendingForAdvisor(userId(ud));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
