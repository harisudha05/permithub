package com.permithub.service;

public interface WhatsAppService {
    void sendParentOutpassLink(String phone, String studentName, String destination,
                               String outTime, String returnTime, String token);
    void sendLeaveNotification(String phone, String studentName, String status, String dates);
    void sendOdNotification(String parentPhone, String studentName, String status, String eventName, String dates);
    
    boolean isConfigured();
    void sendLateEntryAlert(String phone, String studentName, int minutesLate);
}
