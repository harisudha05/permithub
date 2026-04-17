package com.permithub.service;

public interface EmailService {
    void sendPasswordResetEmail(String to, String name, String token);
    void sendWelcomeEmail(String to, String name, String tempPassword);
    void sendLeaveApprovalEmail(String to, String name, String status, String remarks);
    void sendOdApprovalEmail(String to, String name, String status, String remarks);
    void sendOutpassApprovalEmail(String to, String name, String status);
}
