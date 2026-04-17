package com.permithub.service.impl;

import com.permithub.dto.response.NotificationResponse;
import com.permithub.entity.Notification;
import com.permithub.entity.User;
import com.permithub.exception.ResourceNotFoundException;
import com.permithub.repository.NotificationRepository;
import com.permithub.repository.UserRepository;
import com.permithub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notifRepo;
    private final UserRepository userRepo;

    @Async
    @Override
    public void createNotification(Long userId, String title, String message,
                                   String type, Long refId, String refType) {
        User user = userRepo.findById(userId).orElse(null);
        if (user == null) return;
        Notification n = Notification.builder()
                .user(user).title(title).message(message)
                .type(type).referenceId(refId).referenceType(refType)
                .isRead(false).build();
        notifRepo.save(n);
    }

    @Override
    public List<NotificationResponse> getNotifications(Long userId) {
        return notifRepo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notifRepo.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notifRepo.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notifRepo.save(n);
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notifRepo.findByUserIdAndIsReadFalse(userId).forEach(n -> {
            n.setIsRead(true);
            notifRepo.save(n);
        });
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId()).title(n.getTitle()).message(n.getMessage())
                .type(n.getType()).referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType()).isRead(n.getIsRead())
                .createdAt(n.getCreatedAt()).build();
    }
}
