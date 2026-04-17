package com.permithub.controller;

import com.permithub.dto.request.ParentApprovalRequest;
import com.permithub.dto.response.OutpassResponse;
import com.permithub.service.OutpassService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/parent")
@RequiredArgsConstructor
public class ParentController {

    private final OutpassService outpassService;

    @Value("${app.backend-url:http://localhost:8080/api}")
    private String backendUrl;

    /**
     * Review page — parent opens this link from WhatsApp.
     * Shows outpass details + Tamil voice (Web Speech API) + Approve/Reject buttons.
     */
    @GetMapping(value = "/outpass/{token}/review", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> reviewPage(@PathVariable String token) {
        try {
            OutpassResponse o = outpassService.getByParentToken(token);
            String approveUrl = backendUrl + "/parent/outpass/" + token + "/approve";
            String rejectUrl  = backendUrl + "/parent/outpass/" + token + "/reject";

            String tamilSpeech = "PermitHub. உங்கள் மாணவர் " +
                    o.getStudentName().replace("'", "") + " வெளியேறு அனுமதிக்காக விண்ணப்பித்துள்ளார். " +
                    "செல்லும் இடம் " + o.getDestination().replace("'", "") +
                    ". 24 மணி நேரத்திற்குள் அனுமதி வழங்கவும்.";

            String html = "<!DOCTYPE html><html lang='ta'><head>"
                + "<meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<title>PermitHub</title>"
                + "<style>"
                + "*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}"
                + "body{background:#f0fdf4;min-height:100vh;padding:16px 14px 32px}"
                + ".hdr{text-align:center;padding:18px 0 14px}"
                + ".logo{width:52px;height:52px;background:#16a34a;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:8px}"
                + ".brand{font-size:18px;font-weight:700;color:#15803d}"
                + ".card{background:#fff;border-radius:18px;padding:18px 16px;margin-bottom:12px;box-shadow:0 2px 10px rgba(0,0,0,.07)}"
                + ".ct{font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px}"
                + ".sn{font-size:22px;font-weight:800;color:#111;margin-bottom:3px}"
                + ".reg{font-size:13px;color:#9ca3af;margin-bottom:14px}"
                + ".row{display:flex;gap:10px;margin-bottom:10px;align-items:flex-start}"
                + ".ri{font-size:16px;width:22px;flex-shrink:0}"
                + ".rl{font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:1px}"
                + ".rv{font-size:14px;color:#111;font-weight:600}"
                + ".vc{background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:14px;padding:14px 16px;margin-bottom:12px}"
                + ".vt{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}"
                + ".vl{font-size:12px;font-weight:700;color:#16a34a}"
                + ".pb{display:flex;align-items:center;gap:6px;background:#16a34a;color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer}"
                + ".vx{font-size:13px;color:#166534;line-height:1.7}"
                + ".ac{background:#fff;border-radius:18px;padding:18px 16px;margin-bottom:12px;box-shadow:0 2px 10px rgba(0,0,0,.07)}"
                + ".at{font-size:13px;font-weight:700;color:#374151;text-align:center;margin-bottom:14px}"
                + ".btn{display:block;width:100%;padding:18px 12px;border-radius:14px;text-align:center;text-decoration:none;margin-bottom:10px;border:none;cursor:pointer}"
                + ".ba{background:#16a34a;color:#fff}"
                + ".br{background:#fff;color:#dc2626;border:2.5px solid #fca5a5}"
                + ".be{display:block;font-size:18px;font-weight:800}"
                + ".bt{display:block;font-size:15px;font-weight:600;opacity:.9;margin-top:3px}"
                + ".exp{text-align:center;font-size:11px;color:#9ca3af;padding:8px 0;line-height:1.6}"
                + "</style></head><body>"
                + "<div class='hdr'><div class='logo'>🔒</div><div class='brand'>PermitHub</div></div>"
                + "<div class='card'>"
                + "<div class='ct'>Outpass Request / வெளியேறு அனுமதி</div>"
                + "<div class='sn'>" + esc(o.getStudentName()) + "</div>"
                + "<div class='reg'>" + esc(o.getRegisterNumber()) + "</div>"
                + "<div class='row'><div class='ri'>📍</div><div><div class='rl'>Destination / செல்லும் இடம்</div><div class='rv'>" + esc(o.getDestination()) + "</div></div></div>"
                + "<div class='row'><div class='ri'>🕐</div><div><div class='rl'>Departure / புறப்படும் நேரம்</div><div class='rv'>" + formatDt(o.getOutDatetime()) + "</div></div></div>"
                + "<div class='row'><div class='ri'>🔙</div><div><div class='rl'>Return by / திரும்பும் நேரம்</div><div class='rv'>" + formatDt(o.getReturnDatetime()) + "</div></div></div>"
                + (o.getReason() != null ? "<div class='row'><div class='ri'>📝</div><div><div class='rl'>Reason / காரணம்</div><div class='rv'>" + esc(o.getReason()) + "</div></div></div>" : "")
                + "</div>"
                + "<div class='vc'>"
                + "<div class='vt'><div class='vl'>🔊 Voice Message / குரல் செய்தி</div>"
                + "<button class='pb' id='pb' onclick='speak()'>"
                + "<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'><path d='M8 5v14l11-7z'/></svg>Play</button></div>"
                + "<div class='vx'>" + esc(tamilSpeech) + "</div>"
                + "</div>"
                + "<div class='ac'>"
                + "<div class='at'>Please respond / உங்கள் பதிலை தேர்ந்தெடுக்கவும்:</div>"
                + "<a href='" + approveUrl + "' class='btn ba'>"
                + "<span class='be'>✅ Approve</span><span class='bt'>அனுமதி</span></a>"
                + "<a href='" + rejectUrl + "' class='btn br'>"
                + "<span class='be'>❌ Reject</span><span class='bt'>அனுமதி இல்லை</span></a>"
                + "</div>"
                + "<div class='exp'>⏰ Valid 24 hours &nbsp;·&nbsp; 24 மணி நேரம் மட்டுமே</div>"
                + "<script>"
                + "var sp=false,tx='" + tamilSpeech.replace("'", "\\'").replace("\\", "\\\\") + "';"
                + "function speak(){"
                + "if(!window.speechSynthesis){alert('Voice not supported. Please read the text.');return;}"
                + "if(sp){window.speechSynthesis.cancel();sp=false;document.getElementById('pb').textContent='▶ Play';return;}"
                + "var u=new SpeechSynthesisUtterance(tx);"
                + "u.lang='ta-IN';u.rate=0.85;u.pitch=1;"
                + "var v=window.speechSynthesis.getVoices();"
                + "var tv=v.find(function(x){return x.lang==='ta-IN'||x.lang==='ta';});"
                + "if(tv)u.voice=tv;"
                + "u.onend=function(){sp=false;document.getElementById('pb').textContent='▶ Play';};"
                + "sp=true;document.getElementById('pb').textContent='⏹ Stop';"
                + "window.speechSynthesis.speak(u);}"
                + "window.speechSynthesis.onvoiceschanged=function(){window.speechSynthesis.getVoices();};"
                + "</script>"
                + "</body></html>";

            return ResponseEntity.ok(html);
        } catch (Exception e) {
            return ResponseEntity.ok(buildHtml("⚠️", "Link Issue",
                e.getMessage() != null ? e.getMessage() : "Invalid or expired link.",
                "The link may have already been used or expired.",
                "இணைப்பு காலாவதியாகியிருக்கலாம்.", "#f59e0b"));
        }
    }

    /** Direct one-tap APPROVE */
    @GetMapping(value = "/outpass/{token}/approve", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> directApprove(@PathVariable String token) {
        try {
            ParentApprovalRequest req = new ParentApprovalRequest();
            req.setApproved(true);
            req.setRemarks("Approved via WhatsApp link");
            outpassService.parentAction(token, req);
            return ResponseEntity.ok(buildHtml("✅", "Approved! / அனுமதிக்கப்பட்டது!",
                "You have approved your ward's outpass request.",
                "The college has been notified. Thank you.",
                "நன்றி! உங்கள் அனுமதி பதிவு செய்யப்பட்டது. கல்லூரிக்கு தகவல் அனுப்பப்பட்டது.",
                "#16a34a"));
        } catch (Exception e) {
            return ResponseEntity.ok(buildHtml("⚠️", "Link Issue",
                e.getMessage() != null ? e.getMessage() : "Something went wrong.",
                "The link may have already been used or expired.",
                "இணைப்பு காலாவதியாகியிருக்கலாம்.", "#f59e0b"));
        }
    }

    /** Direct one-tap REJECT */
    @GetMapping(value = "/outpass/{token}/reject", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> directReject(@PathVariable String token) {
        try {
            ParentApprovalRequest req = new ParentApprovalRequest();
            req.setApproved(false);
            req.setRemarks("Rejected via WhatsApp link");
            outpassService.parentAction(token, req);
            return ResponseEntity.ok(buildHtml("❌", "Rejected / நிராகரிக்கப்பட்டது",
                "You have rejected your ward's outpass request.",
                "The college has been notified. Thank you.",
                "நன்றி! நிராகரிப்பு பதிவு செய்யப்பட்டது. கல்லூரிக்கு தகவல் அனுப்பப்பட்டது.",
                "#dc2626"));
        } catch (Exception e) {
            return ResponseEntity.ok(buildHtml("⚠️", "Link Issue",
                e.getMessage() != null ? e.getMessage() : "Something went wrong.",
                "The link may have already been used or expired.",
                "இணைப்பு காலாவதியாகியிருக்கலாம்.", "#f59e0b"));
        }
    }

    private String formatDt(java.time.LocalDateTime dt) {
        if (dt == null) return "—";
        return dt.format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private String buildHtml(String icon, String title, String message, String sub, String tamil, String color) {
        return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>"
             + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
             + "<title>PermitHub</title>"
             + "<style>*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}"
             + "body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;padding:20px}"
             + ".c{background:#fff;border-radius:20px;padding:40px 28px;max-width:400px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}"
             + ".i{font-size:60px;margin-bottom:16px;display:block}"
             + ".t{font-size:20px;font-weight:700;color:#111;margin-bottom:10px}"
             + ".m{font-size:14px;color:#555;margin-bottom:6px;line-height:1.5}"
             + ".s{font-size:13px;color:#888;margin-bottom:18px}"
             + ".ta{font-size:14px;color:#444;padding:14px;background:#f3f4f6;border-radius:12px;margin-bottom:18px;line-height:1.7}"
             + ".b{display:inline-block;padding:8px 24px;border-radius:99px;color:#fff;font-size:14px;font-weight:600}"
             + ".br{font-size:11px;color:#bbb;margin-top:14px}"
             + "</style></head><body>"
             + "<div class='c'><span class='i'>" + icon + "</span>"
             + "<div class='t'>" + title + "</div>"
             + "<p class='m'>" + message + "</p>"
             + "<p class='s'>" + sub + "</p>"
             + "<div class='ta'>" + tamil + "</div>"
             + "<div class='b' style='background:" + color + "'>PermitHub</div>"
             + "<p class='br'>You can close this tab.</p></div></body></html>";
    }
}
