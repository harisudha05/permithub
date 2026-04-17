package com.permithub.service.impl;

import com.permithub.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class Fast2SMSServiceImpl implements SmsService {

    @Value("${fast2sms.api-key:NOT_CONFIGURED}")
    private String apiKey;

    @Value("${fast2sms.enabled:false}")
    private boolean enabled;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean isConfigured() {
        return enabled && apiKey != null && !apiKey.equals("NOT_CONFIGURED") 
               && !apiKey.startsWith("YOUR_") && !apiKey.isBlank();
    }

    @Async
    @Override
    public void sendOutpassApprovalLink(String phone, String studentName, String destination, 
                                       String outTime, String returnTime, String token) {
        String reviewUrl = frontendUrl + "/parent/approve/" + token;
        
        String message = "PermitHub: Outpass requested by " + studentName + 
                         ". Dest: " + destination + 
                         ". Out: " + outTime + 
                         ". Link: " + reviewUrl;
        
        sendSms(phone, message);
    }

    @Async
    @Override
    public void sendLateEntryAlert(String phone, String studentName, int minutesLate) {
        String message = "PermitHub Alert: Your ward " + studentName + 
                         " returned " + minutesLate + " mins late from outpass. Contact Warden.";
        
        sendSms(phone, message);
    }

    @Async
    @Override
    public void sendSimpleNotification(String phone, String message) {
        // Strip Markdown bold/italics for simple SMS
        String plain = message.replaceAll("\\*", "").replaceAll("_", "");
        sendSms(phone, plain);
    }

    private void sendSms(String phone, String message) {
        if (!isConfigured()) {
            log.warn("════════════════════════════════════════════════");
            log.warn("SMS NOT ENABLED/CONFIGURED — message for {}:", phone);
            log.warn(message);
            log.warn("════════════════════════════════════════════════");
            return;
        }

        try {
            // Fast2SMS Bulk V2 API (POST version)
            String url = "https://www.fast2sms.com/dev/bulkV2";
            
            // Fast2SMS expects 10-digit numbers or comma-separated list
            String cleanPhone = phone.replaceAll("[^0-9]", "");
            if (cleanPhone.startsWith("91") && cleanPhone.length() == 12) {
                cleanPhone = cleanPhone.substring(2);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("route", "q"); // Quick route
            body.put("message", message);
            body.put("language", "english");
            body.put("flash", 0);
            body.put("numbers", cleanPhone);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("✅ SMS sent successfully to {}", phone);
            } else {
                log.error("❌ Failed to send SMS to {}. Status: {}", phone, response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("❌ Error sending SMS to {}: {}", phone, e.getMessage());
        }
    }
}
