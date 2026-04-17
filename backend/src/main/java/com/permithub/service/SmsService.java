package com.permithub.service;

public interface SmsService {
    void sendOutpassApprovalLink(String phone, String studentName, String destination, 
                                 String outTime, String returnTime, String token);
    
    void sendLateEntryAlert(String phone, String studentName, int minutesLate);
    
    void sendSimpleNotification(String phone, String message);
    
    boolean isConfigured();
}
