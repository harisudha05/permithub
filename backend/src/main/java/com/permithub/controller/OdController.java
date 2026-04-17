package com.permithub.controller;

import com.permithub.dto.request.*;
import com.permithub.dto.response.*;
import com.permithub.repository.FacultyDetailsRepository;
import com.permithub.repository.UserRepository;
import com.permithub.service.OdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class OdController {

    private final OdService odService;
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

    @PostMapping("/student/od")
    public ResponseEntity<OdResponse> apply(
            @AuthenticationPrincipal UserDetails ud,
            @RequestPart("data") OdRequestDto req,
            @RequestPart(value = "proof", required = false) MultipartFile proof) {
        return ResponseEntity.ok(odService.applyOd(ud.getUsername(), req, proof));
    }

    @GetMapping("/student/od")
    public ResponseEntity<List<OdResponse>> myOds(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(odService.getStudentOds(ud.getUsername()));
    }

    @GetMapping("/faculty/od/mentor/pending")
    public ResponseEntity<List<OdResponse>> mentorPending(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(odService.getPendingForMentor(facultyId(ud)));
    }

    @PutMapping("/faculty/od/{id}/mentor-action")
    public ResponseEntity<OdResponse> mentorAction(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud, @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(odService.mentorAction(id, ud.getUsername(), req));
    }

    @GetMapping("/faculty/od/coordinator/pending")
    public ResponseEntity<List<OdResponse>> coordinatorPending(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(odService.getPendingForCoordinator(facultyId(ud)));
    }

    @PutMapping("/faculty/od/{id}/coordinator-action")
    public ResponseEntity<OdResponse> coordinatorAction(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud, @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(odService.coordinatorAction(id, userId(ud), req));
    }

    @PutMapping("/faculty/od/{id}/advisor-action")
    public ResponseEntity<OdResponse> advisorAction(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud, @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(odService.advisorAction(id, userId(ud), req));
    }

    @GetMapping("/hod/od/pending")
    public ResponseEntity<List<OdResponse>> hodPending(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(odService.getPendingForHod(userId(ud)));
    }

    @PutMapping("/hod/od/{id}/action")
    public ResponseEntity<OdResponse> hodAction(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud, @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(odService.hodAction(id, userId(ud), req));
    }

    @PostMapping("/hod/od/{id}/notify-parent")
    public ResponseEntity<ApiResponse<Void>> notifyParent(@PathVariable Long id) {
        odService.notifyParent(id);
        return ResponseEntity.ok(ApiResponse.success("Parent notified successfully", null));
    }
}
