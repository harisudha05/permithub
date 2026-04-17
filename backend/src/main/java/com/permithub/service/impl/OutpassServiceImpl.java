package com.permithub.service.impl;

import com.permithub.dto.request.ApprovalRequest;
import com.permithub.dto.request.OutpassRequestDto;
import com.permithub.dto.request.ParentApprovalRequest;
import com.permithub.dto.response.OutpassResponse;
import com.permithub.entity.*;
import com.permithub.enums.ApprovalStatus;
import com.permithub.enums.OutpassStatus;
import com.permithub.exception.BadRequestException;
import com.permithub.exception.ResourceNotFoundException;
import com.permithub.enums.ScanType;
import com.permithub.repository.*;
import com.permithub.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OutpassServiceImpl implements OutpassService {

    private final OutpassRequestRepository outpassRepo;
    private final StudentRepository studentRepo;
    private final FacultyDetailsRepository facultyRepo;
    private final UserRepository userRepo;
    private final GateScanRepository gateScanRepo;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final QrCodeService qrCodeService;
    private final WhatsAppService whatsAppService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.parent-approval-expiry-hours:24}")
    private int parentApprovalExpiryHours;

    @Override
    @Transactional
    public OutpassResponse applyOutpass(Long studentUserId, OutpassRequestDto request) {
        Student student = studentRepo.findByUserId(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!student.getIsHosteler()) {
            throw new BadRequestException("Only hostel students can apply for outpass");
        }
        if (request.getOutDatetime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Out time must be in the future");
        }
        if (request.getReturnDatetime().isBefore(request.getOutDatetime())) {
            throw new BadRequestException("Return time must be after out time");
        }

        long hours = Duration.between(request.getOutDatetime(), request.getReturnDatetime()).toHours();
        if (hours > 48) {
            throw new BadRequestException("Outpass cannot exceed 48 hours");
        }

        FacultyDetails mentor = student.getCurrentMentor();
        FacultyDetails advisor = student.getClassAdvisor();

        OutpassRequest outpass = OutpassRequest.builder()
                .student(student)
                .outDatetime(request.getOutDatetime())
                .returnDatetime(request.getReturnDatetime())
                .durationHours(BigDecimal.valueOf(hours))
                .destination(request.getDestination())
                .reason(request.getReason())
                .emergencyContact(request.getEmergencyContact())
                .status(OutpassStatus.PENDING)
                .mentor(mentor)
                .mentorStatus(ApprovalStatus.PENDING)
                .advisor(advisor)
                .advisorStatus(ApprovalStatus.PENDING)
                .build();

        outpass = outpassRepo.save(outpass);

        if (mentor != null) {
            notificationService.createNotification(mentor.getUser().getId(),
                    "New Outpass Request",
                    student.getUser().getName() + " has applied for outpass to " + request.getDestination(),
                    "OUTPASS", outpass.getId(), "OUTPASS_REQUEST");
        }

        return mapToResponse(outpass);
    }

    @Override
    @Transactional
    public OutpassResponse mentorAction(Long outpassId, Long mentorUserId, ApprovalRequest request) {
        OutpassRequest outpass = getOutpass(outpassId);
        FacultyDetails mentor = facultyRepo.findByUserId(mentorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (outpass.getMentor() == null || !outpass.getMentor().getId().equals(mentor.getId())) {
            throw new BadRequestException("You are not assigned as mentor for this outpass request");
        }
        // Ensure association is attached (and satisfy static analyzers)
        outpass.setMentor(mentor);
        if (outpass.getMentorStatus() != ApprovalStatus.PENDING)
            throw new BadRequestException("Already actioned");

        outpass.setMentorStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        outpass.setMentorRemarks(request.getRemarks());
        outpass.setMentorActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            outpass.setStatus(OutpassStatus.REJECTED);
            outpass.setRejectedBy("MENTOR");
            return mapToResponse(outpassRepo.save(outpass));
        } else {
            outpass.setStatus(OutpassStatus.MENTOR_APPROVED);
            // Generate token and set parentStatus=PENDING BEFORE saving
            sendParentLink(outpass);
            // Save first to persist token/expiry
            OutpassRequest saved = outpassRepo.save(outpass);
            // Then send WhatsApp (Twilio) to parent; service can fall back to SMS if configured
            triggerParentWhatsApp(saved);
            return mapToResponse(saved);
        }
    }

    @Override
    @Transactional
    public OutpassResponse parentAction(String token, ParentApprovalRequest request) {
        OutpassRequest outpass = outpassRepo.findByParentToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired link"));

        if (outpass.getParentTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Approval link has expired");
        }
        if (outpass.getParentStatus() != null && outpass.getParentStatus() != ApprovalStatus.PENDING) {
            throw new BadRequestException("Already responded");
        }

        outpass.setParentStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        outpass.setParentRemarks(request.getRemarks());
        outpass.setParentActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            outpass.setStatus(OutpassStatus.REJECTED);
            outpass.setRejectedBy("PARENT");
        } else {
            outpass.setStatus(OutpassStatus.PARENT_APPROVED);
            // Auto-approve advisor if same as mentor
            FacultyDetails mentor = outpass.getMentor();
            FacultyDetails advisor = outpass.getAdvisor();
            if (mentor != null && advisor != null && mentor.getId().equals(advisor.getId())) {
                outpass.setAdvisorStatus(ApprovalStatus.APPROVED);
                outpass.setAdvisorActionAt(LocalDateTime.now());
                outpass.setAdvisorRemarks("Auto-approved (same as mentor)");
                // Continue flow to Warden (skip advisor action only).
                outpass.setStatus(OutpassStatus.ADVISOR_APPROVED);
                notifyWarden(outpass);
            } else if (advisor != null) {
                notificationService.createNotification(advisor.getUser().getId(),
                        "Outpass Pending Your Approval",
                        outpass.getStudent().getUser().getName() + "'s outpass needs your approval",
                        "OUTPASS", outpass.getId(), "OUTPASS_REQUEST");
            }
        }

        return mapToResponse(outpassRepo.save(outpass));
    }

    @Override
    @Transactional
    public OutpassResponse advisorAction(Long outpassId, Long advisorUserId, ApprovalRequest request) {
        OutpassRequest outpass = getOutpass(outpassId);
        if (outpass.getParentStatus() != ApprovalStatus.APPROVED)
            throw new BadRequestException("Parent approval pending");
        if (outpass.getAdvisorStatus() != ApprovalStatus.PENDING)
            throw new BadRequestException("Already actioned");

        outpass.setAdvisorStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        outpass.setAdvisorRemarks(request.getRemarks());
        outpass.setAdvisorActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            outpass.setStatus(OutpassStatus.REJECTED);
            outpass.setRejectedBy("ADVISOR");
        } else {
            outpass.setStatus(OutpassStatus.ADVISOR_APPROVED);
            notifyWarden(outpass);
        }

        return mapToResponse(outpassRepo.save(outpass));
    }

    @Override
    @Transactional
    public OutpassResponse wardenAction(Long outpassId, Long wardenUserId, ApprovalRequest request) {
        OutpassRequest outpass = getOutpass(outpassId);
        if (outpass.getAdvisorStatus() != ApprovalStatus.APPROVED)
            throw new BadRequestException("Advisor approval pending");
        if (outpass.getWardenStatus() != ApprovalStatus.PENDING)
            throw new BadRequestException("Already actioned");

        User warden = userRepo.findById(wardenUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", wardenUserId));
        outpass.setWarden(warden);
        outpass.setWardenStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        outpass.setWardenRemarks(request.getRemarks());
        outpass.setWardenActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            outpass.setStatus(OutpassStatus.REJECTED);
            outpass.setRejectedBy("WARDEN");
        } else {
            outpass.setStatus(OutpassStatus.WARDEN_APPROVED);
            notifyRole(outpass, com.permithub.enums.Role.AO, "Outpass needs AO approval");
        }

        return mapToResponse(outpassRepo.save(outpass));
    }

    @Override
    @Transactional
    public OutpassResponse aoAction(Long outpassId, Long aoUserId, ApprovalRequest request) {
        OutpassRequest outpass = getOutpass(outpassId);
        if (outpass.getWardenStatus() != ApprovalStatus.APPROVED)
            throw new BadRequestException("Warden approval pending");
        if (outpass.getAoStatus() != ApprovalStatus.PENDING)
            throw new BadRequestException("Already actioned");

        User ao = userRepo.findById(aoUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", aoUserId));
        outpass.setAo(ao);
        outpass.setAoStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        outpass.setAoRemarks(request.getRemarks());
        outpass.setAoActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            outpass.setStatus(OutpassStatus.REJECTED);
            outpass.setRejectedBy("AO");
        } else {
            outpass.setStatus(OutpassStatus.AO_APPROVED);
            notifyRole(outpass, com.permithub.enums.Role.PRINCIPAL, "Outpass awaiting principal approval");
        }

        return mapToResponse(outpassRepo.save(outpass));
    }

    @Override
    @Transactional
    public OutpassResponse principalAction(Long outpassId, Long principalUserId, ApprovalRequest request) {
        OutpassRequest outpass = getOutpass(outpassId);
        if (outpass.getAoStatus() != ApprovalStatus.APPROVED)
            throw new BadRequestException("AO approval pending");
        if (outpass.getPrincipalStatus() != ApprovalStatus.PENDING)
            throw new BadRequestException("Already actioned");

        User principal = userRepo.findById(principalUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", principalUserId));
        outpass.setPrincipal(principal);
        outpass.setPrincipalStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        outpass.setPrincipalRemarks(request.getRemarks());
        outpass.setPrincipalActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            outpass.setStatus(OutpassStatus.REJECTED);
            outpass.setRejectedBy("PRINCIPAL");
        } else {
            outpass.setStatus(OutpassStatus.PRINCIPAL_APPROVED);
            // Generate QR
            String qr = qrCodeService.generateQrCode(outpass.getId());
            outpass.setQrCode(qr);
            outpass.setQrGeneratedAt(LocalDateTime.now());
            notificationService.createNotification(outpass.getStudent().getUser().getId(),
                    "Outpass Approved! QR Ready",
                    "Your outpass has been fully approved. Download your QR code.",
                    "OUTPASS", outpass.getId(), "OUTPASS_REQUEST");
            
            // Notify parent via Email that it's approved
            if (outpass.getStudent().getUser().getEmail() != null) {
                emailService.sendOutpassApprovalEmail(
                    outpass.getStudent().getUser().getEmail(), 
                    outpass.getStudent().getUser().getName(), 
                    "APPROVED"
                );
            }
        }

        return mapToResponse(outpassRepo.save(outpass));
    }

    @Override
    public OutpassResponse getByParentToken(String token) {
        OutpassRequest outpass = outpassRepo.findByParentToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid link"));
        if (outpass.getParentTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This link has expired");
        }
        return mapToResponse(outpass);
    }

    @Override
    public OutpassResponse getOutpassById(Long id) {
        return mapToResponse(getOutpass(id));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OutpassResponse> getStudentOutpasses(Long studentUserId) {
        Student s = studentRepo.findByUserId(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        return outpassRepo.findByStudentIdOrderByCreatedAtDesc(s.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OutpassResponse> getPendingForMentor(Long mentorUserId) {
        FacultyDetails f = facultyRepo.findByUserId(mentorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        return outpassRepo.findByMentorIdAndMentorStatus(f.getId(), ApprovalStatus.PENDING)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OutpassResponse> getPendingForAdvisor(Long advisorUserId) {
        FacultyDetails f = facultyRepo.findByUserId(advisorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        return outpassRepo.findByAdvisorIdAndAdvisorStatus(f.getId(), ApprovalStatus.PENDING)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OutpassResponse> getPendingForWarden(Long wardenUserId) {
        // Warden isn't assigned until they act, so fetch by stage status
        return outpassRepo.findByStatusAndWardenStatus(OutpassStatus.ADVISOR_APPROVED, ApprovalStatus.PENDING)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OutpassResponse> getPendingForAo(Long aoUserId) {
        // AO isn't assigned until they act, so fetch by stage status
        return outpassRepo.findByStatusAndAoStatus(OutpassStatus.WARDEN_APPROVED, ApprovalStatus.PENDING)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OutpassResponse> getPendingForPrincipal(Long principalUserId) {
        // Principal isn't assigned until they act, so fetch by stage status
        return outpassRepo.findByStatusAndPrincipalStatus(OutpassStatus.AO_APPROVED, ApprovalStatus.PENDING)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /** Step 1: Generate token and set parentStatus=PENDING on the outpass object (before save) */
    private void sendParentLink(OutpassRequest outpass) {
        String token = UUID.randomUUID().toString();
        outpass.setParentToken(token);
        outpass.setParentTokenExpiry(LocalDateTime.now().plusHours(parentApprovalExpiryHours));
        outpass.setParentStatus(ApprovalStatus.PENDING);
        // Notification is sent AFTER save to ensure token is persisted in DB
    }

    /** Step 2: Send WhatsApp approval link to parent (called AFTER save so token is persisted) */
    private void triggerParentWhatsApp(OutpassRequest saved) {
        Student student = saved.getStudent();
        String phone = (student.getParentWhatsapp() != null && !student.getParentWhatsapp().isBlank())
                ? student.getParentWhatsapp()
                : student.getParentPhone();

        if (phone == null || phone.isBlank()) {
            String link = frontendUrl + "/parent/approve/" + saved.getParentToken();
            org.slf4j.LoggerFactory.getLogger(getClass())
                    .warn("No parent phone for student {}. Approval link: {}", student.getUser().getName(), link);
            return;
        }

        if (!whatsAppService.isConfigured()) {
            // keep behavior consistent with Leave/OD notify-parent endpoints
            throw new BadRequestException("WhatsApp/SMS automation not configured. Please set API keys in application.properties.");
        }

        whatsAppService.sendParentOutpassLink(
                phone,
                student.getUser().getName(),
                saved.getDestination(),
                saved.getOutDatetime() != null ? saved.getOutDatetime().toString() : "",
                saved.getReturnDatetime() != null ? saved.getReturnDatetime().toString() : "",
                saved.getParentToken()
        );
    }

    private void notifyWarden(OutpassRequest outpass) {
        userRepo.findByRole(com.permithub.enums.Role.WARDEN).forEach(w ->
                notificationService.createNotification(w.getId(),
                        "Outpass Pending Warden Approval",
                        outpass.getStudent().getUser().getName() + "'s outpass needs warden approval",
                        "OUTPASS", outpass.getId(), "OUTPASS_REQUEST"));
    }

    private void notifyRole(OutpassRequest outpass, com.permithub.enums.Role role, String msg) {
        userRepo.findByRole(role).forEach(u ->
                notificationService.createNotification(u.getId(),
                        "Outpass Request", outpass.getStudent().getUser().getName() + " - " + msg,
                        "OUTPASS", outpass.getId(), "OUTPASS_REQUEST"));
    }

    private OutpassRequest getOutpass(Long id) {
        return outpassRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outpass request", id));
    }

    @Override
    @Transactional
    public OutpassResponse processQrScan(String qrContent, Long securityUserId) {
        // qrContent is the outpass ID encoded in QR
        String trimmed = qrContent == null ? "" : qrContent.trim();
        Long outpassId;

        // Accept either:
        // 1) plain numeric outpassId
        // 2) PERMITHUB:OUTPASS:<id>:<timestamp> (generated by QrCodeService)
        if (trimmed.matches("\\d+")) {
            outpassId = Long.parseLong(trimmed);
        } else if (qrCodeService.validateQrCode(trimmed)) {
            String[] parts = trimmed.split(":");
            if (parts.length < 3) throw new BadRequestException("Invalid QR code");
            try {
                outpassId = Long.parseLong(parts[2]);
            } catch (NumberFormatException e) {
                throw new BadRequestException("Invalid QR code");
            }
        } else {
            throw new BadRequestException("Invalid QR code");
        }
        OutpassRequest outpass = getOutpass(outpassId);
        if (outpass.getStatus() != OutpassStatus.PRINCIPAL_APPROVED
                && outpass.getStatus() != OutpassStatus.RETURNED) {
            throw new BadRequestException("Outpass is not approved or already used");
        }

        User security = userRepo.findById(securityUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Security user", securityUserId));

        // Determine scan type:
        // - If EXIT exists and ENTRY doesn't => ENTRY
        // - If ENTRY exists and EXIT doesn't => EXIT
        // - If neither exists => auto-detect by time (morning/afternoon => EXIT, evening => ENTRY)
        boolean exitAlreadyDone = gateScanRepo.findByOutpassIdAndScanType(outpassId, ScanType.EXIT).isPresent();
        boolean entryAlreadyDone = gateScanRepo.findByOutpassIdAndScanType(outpassId, ScanType.ENTRY).isPresent();
        if (exitAlreadyDone && entryAlreadyDone) {
            throw new BadRequestException("Outpass scan already completed");
        }

        int hour = LocalDateTime.now().getHour();
        ScanType scanType;
        if (!exitAlreadyDone && !entryAlreadyDone) {
            scanType = hour >= 17 ? ScanType.ENTRY : ScanType.EXIT;
        } else if (exitAlreadyDone) {
            scanType = ScanType.ENTRY;
        } else {
            scanType = ScanType.EXIT;
        }

        LocalDateTime now = LocalDateTime.now();
        boolean isLate = false;
        int lateMinutes = 0;
        if (scanType == ScanType.ENTRY && now.isAfter(outpass.getReturnDatetime())) {
            isLate = true;
            lateMinutes = (int) java.time.Duration.between(outpass.getReturnDatetime(), now).toMinutes();
        }

        GateScan scan = GateScan.builder()
                .outpass(outpass).student(outpass.getStudent())
                .security(security).scanType(scanType)
                .scanTime(now).isLate(isLate).lateMinutes(lateMinutes)
                .qrPayload(trimmed)
                .notes(scanType == ScanType.ENTRY && !exitAlreadyDone ? "ENTRY before EXIT"
                        : scanType == ScanType.EXIT && entryAlreadyDone ? "EXIT after ENTRY" : null)
                .build();
        gateScanRepo.save(scan);

        // Update actual out/in times on the outpass record
        if (scanType == ScanType.EXIT && outpass.getActualOutTime() == null) {
            outpass.setActualOutTime(now);
        }
        if (scanType == ScanType.ENTRY && outpass.getActualInTime() == null) {
            outpass.setActualInTime(now);
        }

        if (scanType == ScanType.ENTRY) {
            outpass.setStatus(OutpassStatus.RETURNED);
            if (isLate) {
                try {
                    Student student = outpass.getStudent();
                    String parentPhone = (student.getParentWhatsapp() != null && !student.getParentWhatsapp().isBlank())
                            ? student.getParentWhatsapp()
                            : student.getParentPhone();
                    if (parentPhone != null && !parentPhone.isBlank() && whatsAppService.isConfigured()) {
                        whatsAppService.sendLateEntryAlert(parentPhone, student.getUser().getName(), lateMinutes);
                    }
                } catch (Exception e) {
                    org.slf4j.LoggerFactory.getLogger(getClass())
                            .warn("Late-entry parent notification failed: {}", e.getMessage());
                }
            }
        }

        OutpassResponse resp = mapToResponse(outpassRepo.save(outpass));
        resp.setScanType(scanType.name());
        resp.setIsLate(isLate);
        resp.setLateMinutes(lateMinutes);
        resp.setScanTime(now);
        return resp;
    }

    @Override
    public OutpassResponse mapToResponse(OutpassRequest o) {
        return OutpassResponse.builder()
                .id(o.getId())
                .studentId(o.getStudent().getId())
                .studentName(o.getStudent().getUser().getName())
                .registerNumber(o.getStudent().getRegisterNumber())
                .hostelName(o.getStudent().getHostelName())
                .roomNumber(o.getStudent().getRoomNumber())
                .parentPhone(o.getStudent().getParentPhone())
                .parentWhatsapp(o.getStudent().getParentWhatsapp() != null
                        ? o.getStudent().getParentWhatsapp()
                        : o.getStudent().getParentPhone())
                .outDatetime(o.getOutDatetime())
                .returnDatetime(o.getReturnDatetime())
                .actualOutTime(o.getActualOutTime())
                .actualInTime(o.getActualInTime())
                .durationHours(o.getDurationHours() != null ? o.getDurationHours().doubleValue() : null)
                .destination(o.getDestination())
                .reason(o.getReason())
                .emergencyContact(o.getEmergencyContact())
                .status(o.getStatus())
                .mentorStatus(o.getMentorStatus())
                .mentorRemarks(o.getMentorRemarks())
                .mentorActionAt(o.getMentorActionAt())
                .parentStatus(o.getParentStatus())
                .parentRemarks(o.getParentRemarks())
                .parentToken(o.getParentToken())
                .parentActionAt(o.getParentActionAt())
                .advisorStatus(o.getAdvisorStatus())
                .advisorRemarks(o.getAdvisorRemarks())
                .wardenStatus(o.getWardenStatus())
                .wardenRemarks(o.getWardenRemarks())
                .aoStatus(o.getAoStatus())
                .aoRemarks(o.getAoRemarks())
                .principalStatus(o.getPrincipalStatus())
                .principalRemarks(o.getPrincipalRemarks())
                .qrCode(o.getQrCode())
                .createdAt(o.getCreatedAt())
                .build();
    }
}

// NOTE: Add these fields to the class and implement processQrScan
