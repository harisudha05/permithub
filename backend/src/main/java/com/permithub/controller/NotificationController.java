package com.permithub.controller;

import com.permithub.dto.response.*;
import com.permithub.repository.UserRepository;
import com.permithub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private Long userId(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new com.permithub.exception.ResourceNotFoundException("User not found"))
                .getId();
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(notificationService.getNotifications(userId(ud)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId(ud))));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal UserDetails ud) {
        notificationService.markAllAsRead(userId(ud));
        return ResponseEntity.ok(ApiResponse.success("Marked all as read", null));
    }
}
