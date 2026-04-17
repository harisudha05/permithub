package com.permithub.service;
import com.permithub.dto.response.NotificationResponse;
import java.util.List;

public interface NotificationService {
    void createNotification(Long userId, String title, String message, String type, Long refId, String refType);
    List<NotificationResponse> getNotifications(Long userId);
    long getUnreadCount(Long userId);
    void markAsRead(Long notificationId, Long userId);
    void markAllAsRead(Long userId);
}
