package com.permithub.service.impl;

import com.permithub.service.WhatsAppService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class WhatsAppServiceImpl implements WhatsAppService {

    private final com.permithub.service.SmsService smsService;

    public WhatsAppServiceImpl(@org.springframework.context.annotation.Lazy com.permithub.service.SmsService smsService) {
        this.smsService = smsService;
    }

    @Value("${twilio.account-sid:NOT_CONFIGURED}")
    private String accountSid;

    @Value("${twilio.auth-token:NOT_CONFIGURED}")
    private String authToken;

    @Value("${twilio.whatsapp-from:whatsapp:+14155238886}")
    private String whatsappFrom;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.backend-url:http://localhost:8080/api}")
    private String backendUrl;

    private boolean isTwilioConfigured() {
        return accountSid != null && !accountSid.equals("NOT_CONFIGURED")
                && !accountSid.startsWith("YOUR_") && !accountSid.isBlank()
                && authToken != null && !authToken.equals("NOT_CONFIGURED")
                && !authToken.startsWith("YOUR_") && !authToken.isBlank();
    }

    @Override
    public boolean isConfigured() {
        return isTwilioConfigured() || (smsService != null && smsService.isConfigured());
    }

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() == 10) return "+91" + digits;
        if (digits.length() == 12 && digits.startsWith("91")) return "+" + digits;
        if (digits.length() == 11 && digits.startsWith("0")) return "+91" + digits.substring(1);
        return "+" + digits;
    }

    /** Google TTS voice link — parent taps to hear Tamil audio */
    private String voiceLink(String tamilText) {
        try {
            String encoded = URLEncoder.encode(tamilText.substring(0, Math.min(tamilText.length(), 200)),
                    StandardCharsets.UTF_8);
            return "https://translate.google.com/translate_tts?ie=UTF-8&tl=ta&client=tw-ob&q=" + encoded;
        } catch (Exception e) {
            return "";
        }
    }

    @Override
    public void sendParentOutpassLink(String phone, String studentName, String destination,
                                      String outTime, String returnTime, String token) {
        String reviewUrl = frontendUrl + "/parent/approve/" + token;

        String message =
            "🔔 *PermitHub – Outpass Approval*\n\n" +
            "Dear Parent / அன்பான பெற்றோர்,\n\n" +
            "Your ward *" + studentName + "* has applied for an outpass.\n" +
            "உங்கள் மாணவர் *" + studentName + "* வெளியேறு அனுமதி கோரியுள்ளார்.\n\n" +
            "📍 " + destination + "\n" +
            "🕐 " + outTime + "\n" +
            "🔙 " + returnTime + "\n\n" +
            "━━━━━━━━━━━━━━━━━━\n" +
            "👇 *Tap below to Approve or Reject / கீழே தட்டவும்:*\n\n" +
            reviewUrl + "\n\n" +
            "⏰ Valid 24 hours / 24 மணி நேரம் மட்டுமே\n\n" +
            "– PermitHub";

        sendWhatsApp(phone, message);
    }

    @Async
    @Override
    public void sendLeaveNotification(String phone, String studentName, String status, String dates) {
        boolean approved = "approved".equalsIgnoreCase(status);
        String emoji     = approved ? "✅" : "❌";
        String statusEn  = approved ? "APPROVED" : "REJECTED";
        String statusTa  = approved ? "அனுமதிக்கப்பட்டது" : "நிராகரிக்கப்பட்டது";
        String tamilVoice = "PermitHub. உங்கள் மாணவர் " + studentName +
                " அவர்களின் விடுப்பு கோரிக்கை HOD ஆல் " + statusTa + ".";

        String message =
            emoji + " *PermitHub – Leave Notification*\n\n" +
            "*English:*\n" +
            "Dear Parent,\n" +
            "Your ward *" + studentName + "*'s leave for *" + dates + "* has been *" + statusEn + "* by HOD.\n" +
            (approved ? "Please ensure your ward returns on the scheduled date.\n" : "") +
            "\n━━━━━━━━━━━━━━━━━━\n" +
            "*தமிழ் (Tamil):*\n" +
            "அன்பான பெற்றோர்,\n" +
            "உங்கள் மாணவர் *" + studentName + "* அவர்களின் *" + dates + "* விடுப்பு கோரிக்கை HOD ஆல் *" + statusTa + "*.\n" +
            (approved ? "குறிப்பிட்ட தேதியில் மாணவர் கல்லூரிக்கு திரும்புவதை உறுதிப்படுத்தவும்.\n" : "") +
            "\n━━━━━━━━━━━━━━━━━━\n" +
            "🔊 *Voice Message (Tamil):*\n" +
            voiceLink(tamilVoice) + "\n\n" +
            "– PermitHub";

        sendWhatsApp(phone, message);
    }

    @Async
    @Override
    public void sendOdNotification(String phone, String studentName, String status, String eventName, String dates) {
        boolean approved = "approved".equalsIgnoreCase(status);
        String emoji     = approved ? "✅" : "❌";
        String statusEn  = approved ? "APPROVED" : "REJECTED";
        String statusTa  = approved ? "அனுமதிக்கப்பட்டது" : "நிராகரிக்கப்பட்டது";
        String tamilVoice = "PermitHub. உங்கள் மாணவர் " + studentName +
                " அவர்களின் OD கோரிக்கை " + eventName + " நிகழ்வுக்காக HOD ஆல் " + statusTa + ".";

        String message =
            emoji + " *PermitHub – OD Notification*\n\n" +
            "*English:*\n" +
            "Dear Parent,\n" +
            "Your ward *" + studentName + "*'s On-Duty for *" + eventName + "* (" + dates + ") has been *" + statusEn + "* by HOD.\n\n" +
            "━━━━━━━━━━━━━━━━━━\n" +
            "*தமிழ் (Tamil):*\n" +
            "அன்பான பெற்றோர்,\n" +
            "உங்கள் மாணவர் *" + studentName + "* அவர்களின் OD கோரிக்கை (*" + eventName + "*, " + dates + ") HOD ஆல் *" + statusTa + "*.\n\n" +
            "━━━━━━━━━━━━━━━━━━\n" +
            "🔊 *Voice Message (Tamil):*\n" +
            voiceLink(tamilVoice) + "\n\n" +
            "– PermitHub";

        sendWhatsApp(phone, message);
    }

    @Async
    @Override
    public void sendLateEntryAlert(String phone, String studentName, int minutesLate) {
        String tamilVoice = "PermitHub. உங்கள் மாணவர் " + studentName +
                " வெளியேறு அனுமதியிலிருந்து " + minutesLate + " நிமிடங்கள் தாமதமாக திரும்பியுள்ளார்.";

        String message =
            "⚠️ *PermitHub – Late Return Alert*\n\n" +
            "*English:*\n" +
            "Dear Parent,\n" +
            "Your ward *" + studentName + "* returned *" + minutesLate + " minutes late* from outpass.\n" +
            "Please contact the warden for details.\n\n" +
            "━━━━━━━━━━━━━━━━━━\n" +
            "*தமிழ் (Tamil):*\n" +
            "அன்பான பெற்றோர்,\n" +
            "உங்கள் மாணவர் *" + studentName + "* வெளியேறு அனுமதியிலிருந்து *" + minutesLate + " நிமிடங்கள் தாமதமாக* திரும்பியுள்ளார்.\n" +
            "மேலும் விவரங்களுக்கு warden ஐ தொடர்பு கொள்ளவும்.\n\n" +
            "━━━━━━━━━━━━━━━━━━\n" +
            "🔊 *Voice Message (Tamil):*\n" +
            voiceLink(tamilVoice) + "\n\n" +
            "– PermitHub";

        sendWhatsApp(phone, message);
    }

    private void sendWhatsApp(String phone, String message) {
        String normalizedPhone = normalizePhone(phone);

        if (!isTwilioConfigured()) {
            log.warn("════════════════════════════════════════════════");
            log.warn("WHATSAPP NOT CONFIGURED — FALLING BACK TO SMS for {}:", normalizedPhone);
            log.warn(message);
            log.warn("════════════════════════════════════════════════");
            log.warn("To enable: set twilio.account-sid and twilio.auth-token in application.properties");
            
            // Fallback to SMS
            if (smsService != null && smsService.isConfigured()) {
                smsService.sendSimpleNotification(normalizedPhone, message);
            } else {
                log.error("❌ SMS Fallback also not configured! Notification failed.");
            }
            return;
        }

        try {
            com.twilio.Twilio.init(accountSid, authToken);
            com.twilio.rest.api.v2010.account.Message.creator(
                new com.twilio.type.PhoneNumber("whatsapp:" + normalizedPhone),
                new com.twilio.type.PhoneNumber(whatsappFrom),
                message
            ).create();
            log.info("✅ WhatsApp sent to {}", normalizedPhone);
        } catch (Exception e) {
            log.error("❌ WhatsApp failed to {}: {}", normalizedPhone, e.getMessage());
        }
    }
}
