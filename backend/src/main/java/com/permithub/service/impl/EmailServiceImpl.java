package com.permithub.service.impl;

import com.permithub.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@permithub.edu}")
    private String from;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private boolean isMailConfigured() {
        return smtpUsername != null && !smtpUsername.isBlank()
                && !smtpUsername.equals("your_gmail@gmail.com")
                && smtpPassword != null && !smtpPassword.isBlank()
                && !smtpPassword.equals("your_16char_app_password");
    }

    @Async
    @Override
    public void sendPasswordResetEmail(String to, String name, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        String html = "<div style='font-family:Arial,sans-serif;max-width:500px;margin:auto'>"
            + "<h2 style='color:#1d9e75'>PermitHub - Password Reset</h2>"
            + "<p>Hi <b>" + name + "</b>,</p>"
            + "<p>You requested a password reset. Click the button below:</p>"
            + "<a href='" + link + "' style='display:inline-block;background:#1d9e75;color:#fff;"
            + "padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0'>"
            + "Reset Password</a>"
            + "<p style='color:#666;font-size:12px'>Or copy this link: <br><a href='" + link + "'>" + link + "</a></p>"
            + "<p style='color:#999;font-size:11px'>This link expires in 2 hours. If you didn't request this, ignore this email.</p>"
            + "<hr style='border:none;border-top:1px solid #eee'><p style='color:#999;font-size:11px'>PermitHub Team</p>"
            + "</div>";

        boolean sent = sendHtmlEmail(to, "Reset Your PermitHub Password", html);
        if (!sent) {
            // Always log reset link — useful during dev
            log.warn("════════════════════════════════════════════════");
            log.warn("PASSWORD RESET LINK (email not sent to {}):", to);
            log.warn(link);
            log.warn("════════════════════════════════════════════════");
        }
    }

    @Async
    @Override
    public void sendWelcomeEmail(String to, String name, String tempPassword) {
        String body = "Hi " + name + ",\n\nYour PermitHub account has been created.\n"
                + "Email: " + to + "\nTemporary Password: " + tempPassword
                + "\n\nPlease login and change your password immediately.\n\n— PermitHub Team";
        sendEmail(to, "Welcome to PermitHub", body);
    }

    @Async
    @Override
    public void sendLeaveApprovalEmail(String to, String name, String status, String remarks) {
        boolean approved = "APPROVED".equalsIgnoreCase(status);
        String color = approved ? "#1d9e75" : "#d9534f";
        String html = "<div style='font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:20px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1);border:1px solid #eee'>"
            + "<div style='background:" + color + ";padding:24px;text-align:center'><h2 style='color:#fff;margin:0'>PermitHub - Leave " + status + "</h2></div>"
            + "<div style='padding:24px;color:#333;line-height:1.6'>"
            + "Hi <b>" + name + "</b>,</p>"
            + "<p>Your leave request has been processed.</p>"
            + "<div style='background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid " + color + "'>"
            + "<b>Status:</b> <span style='color:" + color + ";font-weight:bold'>" + status.toUpperCase() + "</span><br>"
            + (remarks != null && !remarks.isBlank() ? "<b>Remarks:</b> " + remarks : "")
            + "</div>"
            + "<p style='margin-top:20px'>You can view more details on your dashboard.</p>"
            + "<a href='" + frontendUrl + "/student/dashboard' style='display:inline-block;background:" + color + ";color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0'>View Dashboard</a>"
            + "</div>"
            + "<div style='background:#f4f4f4;padding:16px;text-align:center;font-size:12px;color:#888'>&copy; PermitHub College Automation System</div>"
            + "</div>";
        sendHtmlEmail(to, "Leave Request " + status, html);
    }

    @Async
    @Override
    public void sendOdApprovalEmail(String to, String name, String status, String remarks) {
        boolean approved = "APPROVED".equalsIgnoreCase(status);
        String color = approved ? "#3498db" : "#d9534f";
        String html = "<div style='font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:20px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1);border:1px solid #eee'>"
            + "<div style='background:" + color + ";padding:24px;text-align:center'><h2 style='color:#fff;margin:0'>PermitHub - OD " + status + "</h2></div>"
            + "<div style='padding:24px;color:#333;line-height:1.6'>"
            + "Hi <b>" + name + "</b>,</p>"
            + "<p>Your On-Duty (OD) request has been processed.</p>"
            + "<div style='background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid " + color + "'>"
            + "<b>Status:</b> <span style='color:" + color + ";font-weight:bold'>" + status.toUpperCase() + "</span><br>"
            + (remarks != null && !remarks.isBlank() ? "<b>Remarks:</b> " + remarks : "")
            + "</div>"
            + "<p style='margin-top:20px'>Click below to check your full history.</p>"
            + "<a href='" + frontendUrl + "/student/dashboard' style='display:inline-block;background:" + color + ";color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0'>View History</a>"
            + "</div>"
            + "<div style='background:#f4f4f4;padding:16px;text-align:center;font-size:12px;color:#888'>&copy; PermitHub College Automation System</div>"
            + "</div>";
        sendHtmlEmail(to, "OD Request " + status, html);
    }

    @Async
    @Override
    public void sendOutpassApprovalEmail(String to, String name, String status) {
        boolean approved = "APPROVED".equalsIgnoreCase(status);
        String color = approved ? "#8e44ad" : "#d9534f";
        String html = "<div style='font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:20px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1);border:1px solid #eee'>"
            + "<div style='background:" + color + ";padding:24px;text-align:center'><h2 style='color:#fff;margin:0'>PermitHub - Outpass " + status + "</h2></div>"
            + "<div style='padding:24px;color:#333;line-height:1.6'>"
            + "Hi <b>" + name + "</b>,</p>"
            + "<p>Your outpass request has been fully *" + status.toLowerCase() + "*.</p>"
            + (approved ? "<p style='color:#2c3e50;font-weight:600'>🎉 Your unique QR code is now available on your dashboard!</p>" : "")
            + "<div style='background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid " + color + "'>"
            + "<b>Status:</b> <span style='color:" + color + ";font-weight:bold'>" + status.toUpperCase() + "</span>"
            + "</div>"
            + "<a href='" + frontendUrl + "/student/dashboard' style='display:inline-block;background:" + color + ";color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0'>Download QR Code</a>"
            + "</div>"
            + "<div style='background:#f4f4f4;padding:16px;text-align:center;font-size:12px;color:#888'>&copy; PermitHub College Automation System</div>"
            + "</div>";
        sendHtmlEmail(to, "Outpass " + status, html);
    }

    // ── Send helpers ─────────────────────────────────────────

    private boolean sendHtmlEmail(String to, String subject, String htmlBody) {
        if (!isMailConfigured()) {
            log.warn("Mail not configured — skipping email to {}", to);
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);  // true = HTML
            mailSender.send(message);
            log.info("✅ Email sent to {}: {}", to, subject);
            return true;
        } catch (Exception e) {
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage());
            return false;
        }
    }

    private boolean sendEmail(String to, String subject, String body) {
        if (!isMailConfigured()) {
            log.info("Mail not configured — skipping email to {}: {}", to, subject);
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
            log.info("✅ Email sent to {}: {}", to, subject);
            return true;
        } catch (Exception e) {
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage());
            return false;
        }
    }
}
