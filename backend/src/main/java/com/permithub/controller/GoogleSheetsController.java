package com.permithub.controller;

import com.permithub.dto.response.ApiResponse;
import com.permithub.repository.UserRepository;
import com.permithub.service.GoogleSheetsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/faculty/sheets")
@RequiredArgsConstructor
public class GoogleSheetsController {

    private final GoogleSheetsService sheetsService;
    private final UserRepository userRepo;

    private Long userId(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new com.permithub.exception.ResourceNotFoundException("User not found")).getId();
    }

    /**
     * Export mentor's mentees to Google Sheets.
     * Body (optional): { "studentIds": [1,2,3] } — if empty, exports all mentees.
     */
    @PostMapping("/mentees")
    public ResponseEntity<ApiResponse<Map<String,String>>> exportMentees(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody(required = false) Map<String, List<Long>> body) {
        try {
            List<Long> ids = body != null && body.containsKey("studentIds") ? body.get("studentIds") : List.of();
            String url = sheetsService.exportMenteesToSheet(userId(ud), ids);
            return ResponseEntity.ok(ApiResponse.ok("Sheet created successfully", Map.of("url", url)));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to create sheet: " + e.getMessage()));
        }
    }

    /**
     * Export class students (advisor) to Google Sheets.
     * Body (optional): { "studentIds": [1,2,3] } — if empty, exports all class students.
     */
    @PostMapping("/class")
    public ResponseEntity<ApiResponse<Map<String,String>>> exportClass(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody(required = false) Map<String, List<Long>> body) {
        try {
            List<Long> ids = body != null && body.containsKey("studentIds") ? body.get("studentIds") : List.of();
            String url = sheetsService.exportClassStudentsToSheet(userId(ud), ids);
            return ResponseEntity.ok(ApiResponse.ok("Sheet created successfully", Map.of("url", url)));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to create sheet: " + e.getMessage()));
        }
    }

    /**
     * Export event participants (OD requests for events the faculty coordinates) to Google Sheets.
     * Body (optional): { "odRequestIds": [1,2,3] } — if empty, exports all pending ODs for coordinator.
     */
    @PostMapping("/events")
    public ResponseEntity<ApiResponse<Map<String,String>>> exportEventParticipants(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody(required = false) Map<String, List<Long>> body) {
        try {
            List<Long> ids = body != null && body.containsKey("odRequestIds") ? body.get("odRequestIds") : List.of();
            String url = sheetsService.exportEventParticipantsToSheet(userId(ud), ids);
            return ResponseEntity.ok(ApiResponse.ok("Sheet created successfully", Map.of("url", url)));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to create sheet: " + e.getMessage()));
        }
    }
}
