package com.permithub.service.impl;

import com.permithub.dto.request.ApprovalRequest;
import com.permithub.dto.request.LeaveRequestDto;
import com.permithub.dto.response.LeaveResponse;
import com.permithub.entity.*;
import com.permithub.enums.ApprovalStatus;
import com.permithub.enums.LeaveStatus;
import com.permithub.enums.Role;
import com.permithub.exception.BadRequestException;
import com.permithub.exception.ResourceNotFoundException;
import com.permithub.repository.*;
import com.permithub.service.FileStorageService;
import com.permithub.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveServiceImpl implements LeaveService {

    private final LeaveRequestRepository leaveRepo;
    private final StudentRepository studentRepo;
    private final FacultyDetailsRepository facultyRepo;
    private final LeaveBalanceRepository leaveBalanceRepo;
    private final SemesterRepository semesterRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final FileStorageService fileStorageService;

    private Student getStudentByEmail(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return studentRepo.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
    }

    // ── APPLY ────────────────────────────────────────────────
    @Override
    @Transactional
    public LeaveResponse applyLeave(String email, LeaveRequestDto request, MultipartFile certificate) {
        Student student = getStudentByEmail(email);
        Semester semester = semesterRepo.findByIsActiveTrue()
                .orElseThrow(() -> new BadRequestException("No active semester found"));

        if (request.getFromDate().isBefore(LocalDate.now()) && !request.isEmergency())
            throw new BadRequestException("Cannot apply leave for past dates");
        if (request.getToDate().isBefore(request.getFromDate()))
            throw new BadRequestException("End date must be after start date");

        int totalDays = (int) ChronoUnit.DAYS.between(request.getFromDate(), request.getToDate()) + 1;
        if (totalDays > 10) throw new BadRequestException("Cannot apply for more than 10 days at once");

        // Check leave balance
        LeaveBalance balance = leaveBalanceRepo
                .findByStudentIdAndSemesterId(student.getId(), semester.getId())
                .orElseGet(() -> leaveBalanceRepo.save(LeaveBalance.builder()
                        .student(student).semester(semester)
                        .totalLeaves(semester.getDefaultLeaveLimit()).usedLeaves(0).build()));

        if (balance.getRemainingLeaves() < totalDays)
            throw new BadRequestException("Insufficient leave balance. Remaining: " + balance.getRemainingLeaves());

        // Check overlap
        boolean overlap = leaveRepo.existsByStudentIdAndFromDateLessThanEqualAndToDateGreaterThanEqualAndStatusNot(
                student.getId(), request.getToDate(), request.getFromDate(), LeaveStatus.CANCELLED);
        if (overlap) throw new BadRequestException("You already have a leave request overlapping these dates");

        String certPath = null;
        if (certificate != null && !certificate.isEmpty())
            certPath = fileStorageService.storeFile(certificate, "certificates");

        FacultyDetails mentor  = student.getCurrentMentor();
        FacultyDetails advisor = student.getClassAdvisor();

        LeaveRequest leave = LeaveRequest.builder()
                .student(student).semester(semester)
                .category(request.getCategory())
                .fromDate(request.getFromDate()).toDate(request.getToDate())
                .totalDays(totalDays).reason(request.getReason())
                .description(request.getDescription())
                .isEmergency(request.isEmergency())
                .medicalCertificate(certPath)
                .status(LeaveStatus.PENDING)
                .mentor(mentor).mentorStatus(ApprovalStatus.PENDING)
                .advisor(advisor).advisorStatus(ApprovalStatus.PENDING)
                .hodStatus(ApprovalStatus.PENDING)
                .build();

        leave = leaveRepo.save(leave);
        log.info("Leave applied: student={}, days={}, mentor={}", student.getUser().getName(), totalDays,
                mentor != null ? mentor.getUser().getName() : "NONE");

        // Notify mentor
        if (mentor != null) {
            notificationService.createNotification(mentor.getUser().getId(),
                    "New Leave Request - Action Required",
                    student.getUser().getName() + " applied for " + totalDays + " day(s) "
                            + request.getCategory().name().toLowerCase() + " leave. Please review.",
                    "LEAVE", leave.getId(), "LEAVE_REQUEST");
        }
        return mapToResponse(leave);
    }

    // ── MENTOR ACTION ────────────────────────────────────────
    @Override
    @Transactional
    public LeaveResponse mentorAction(Long leaveId, String mentorEmail, ApprovalRequest request) {
        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (leave.getMentorStatus() != ApprovalStatus.PENDING)
            throw new BadRequestException("Already actioned by mentor");

        User mentorUser = userRepo.findByEmail(mentorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        FacultyDetails mentor = facultyRepo.findByUserId(mentorUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        leave.setMentorStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        leave.setMentorRemarks(request.getRemarks());
        leave.setMentorActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            // Rejected by mentor — cancel immediately
            leave.setStatus(LeaveStatus.REJECTED);
            leave.setRejectedBy("MENTOR");
            leave.setRejectionReason(request.getRemarks());
            notifyStudent(leave, "Leave Rejected by Mentor",
                    "Your leave request was rejected by mentor" +
                    (request.getRemarks() != null ? ": " + request.getRemarks() : "."));
        } else {
            // Mentor approved — check if mentor is also advisor
            FacultyDetails advisor = leave.getAdvisor();
            boolean mentorIsAdvisor = advisor != null && advisor.getId().equals(mentor.getId());

            if (mentorIsAdvisor) {
                // Auto-approve advisor step
                leave.setAdvisorStatus(ApprovalStatus.APPROVED);
                leave.setAdvisorActionAt(LocalDateTime.now());
                leave.setAdvisorRemarks("Auto-approved (mentor and class advisor are the same person)");
                leave.setStatus(LeaveStatus.ADVISOR_APPROVED);
                log.info("Leave {}: Mentor=Advisor same person, auto-approved advisor step", leaveId);
                notifyHod(leave);
            } else {
                // Move to mentor-approved, notify advisor
                leave.setStatus(LeaveStatus.MENTOR_APPROVED);
                if (advisor != null) {
                    notificationService.createNotification(advisor.getUser().getId(),
                            "Leave Pending Your Approval - Class Advisor",
                            leave.getStudent().getUser().getName() + "'s leave request needs your approval as class advisor.",
                            "LEAVE", leave.getId(), "LEAVE_REQUEST");
                } else {
                    // No advisor — skip to HOD directly
                    leave.setAdvisorStatus(ApprovalStatus.APPROVED);
                    leave.setAdvisorActionAt(LocalDateTime.now());
                    leave.setAdvisorRemarks("Auto-approved (no class advisor assigned)");
                    leave.setStatus(LeaveStatus.ADVISOR_APPROVED);
                    notifyHod(leave);
                }
            }
        }
        return mapToResponse(leaveRepo.save(leave));
    }

    // ── ADVISOR ACTION ───────────────────────────────────────
    @Override
    @Transactional
    public LeaveResponse advisorAction(Long leaveId, Long advisorUserId, ApprovalRequest request) {
        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (leave.getMentorStatus() != ApprovalStatus.APPROVED)
            throw new BadRequestException("Mentor has not approved yet");
        if (leave.getAdvisorStatus() != ApprovalStatus.PENDING)
            throw new BadRequestException("Already actioned by advisor");

        leave.setAdvisorStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        leave.setAdvisorRemarks(request.getRemarks());
        leave.setAdvisorActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            leave.setStatus(LeaveStatus.REJECTED);
            leave.setRejectedBy("ADVISOR");
            leave.setRejectionReason(request.getRemarks());
            notifyStudent(leave, "Leave Rejected by Class Advisor",
                    "Your leave request was rejected by class advisor" +
                    (request.getRemarks() != null ? ": " + request.getRemarks() : "."));
        } else {
            leave.setStatus(LeaveStatus.ADVISOR_APPROVED);
            notifyHod(leave);
        }
        return mapToResponse(leaveRepo.save(leave));
    }

    // ── HOD ACTION ───────────────────────────────────────────
    @Override
    @Transactional
    public LeaveResponse hodAction(Long leaveId, Long hodUserId, ApprovalRequest request) {
        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        // Validate: must be ADVISOR_APPROVED status (not checking advisorStatus field
        // because it could be auto-approved and the field check was causing issues)
        if (leave.getStatus() != LeaveStatus.ADVISOR_APPROVED)
            throw new BadRequestException("Leave is not yet approved by class advisor. Current status: " + leave.getStatus());
        if (leave.getHodStatus() != ApprovalStatus.PENDING)
            throw new BadRequestException("Already actioned by HOD");

        User hod = userRepo.findById(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", hodUserId));

        leave.setHod(hod);
        leave.setHodStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        leave.setHodRemarks(request.getRemarks());
        leave.setHodActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            leave.setStatus(LeaveStatus.REJECTED);
            leave.setRejectedBy("HOD");
            leave.setRejectionReason(request.getRemarks());
            notifyStudent(leave, "Leave Rejected by HOD",
                    "Your leave request was rejected by HOD" +
                    (request.getRemarks() != null ? ": " + request.getRemarks() : "."));
        } else {
            leave.setStatus(LeaveStatus.HOD_APPROVED);

            // ── Update leave balance ───────────────────────
            Semester semester = leave.getSemester();
            LeaveBalance balance = leaveBalanceRepo
                    .findByStudentIdAndSemesterId(leave.getStudent().getId(), semester.getId())
                    .orElseGet(() -> leaveBalanceRepo.save(LeaveBalance.builder()
                            .student(leave.getStudent()).semester(semester)
                            .totalLeaves(semester.getDefaultLeaveLimit()).usedLeaves(0).build()));

            int prevUsed = balance.getUsedLeaves();
            balance.setUsedLeaves(prevUsed + leave.getTotalDays());
            leaveBalanceRepo.save(balance);
            log.info("Leave balance updated: student={}, used {} → {}, remaining={}",
                    leave.getStudent().getUser().getName(),
                    prevUsed, balance.getUsedLeaves(), balance.getRemainingLeaves());

            // ── Notify student ─────────────────────────────
            notifyStudent(leave, "🎉 Leave Fully Approved!",
                    "Your " + leave.getCategory().name().toLowerCase() + " leave from "
                    + leave.getFromDate() + " to " + leave.getToDate()
                    + " (" + leave.getTotalDays() + " day" + (leave.getTotalDays() > 1 ? "s" : "") + ")"
                    + " has been approved by HOD. Remaining balance: " + balance.getRemainingLeaves() + " days.");

            // ── Send Email to parent/student (Free alternative to WhatsApp) ──
            if (leave.getStudent().getUser().getEmail() != null) {
                log.info("Sending approval email to student/parent at {}", leave.getStudent().getUser().getEmail());
                emailService.sendLeaveApprovalEmail(
                    leave.getStudent().getUser().getEmail(), 
                    leave.getStudent().getUser().getName(), 
                    "APPROVED", 
                    leave.getHodRemarks()
                );
            }
        }
        return mapToResponse(leaveRepo.save(leave));
    }

    // ── QUERIES ──────────────────────────────────────────────
    @Override
    public LeaveResponse getLeaveById(Long id) {
        return mapToResponse(leaveRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request", id)));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<LeaveResponse> getStudentLeaves(String email) {
        Student student = getStudentByEmail(email);
        return leaveRepo.findByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<LeaveResponse> getPendingForMentor(Long mentorFacultyId) {
        return leaveRepo.findByMentorIdAndMentorStatus(mentorFacultyId, ApprovalStatus.PENDING)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<LeaveResponse> getPendingForAdvisor(Long advisorFacultyId) {
        return leaveRepo.findByAdvisorIdAndAdvisorStatus(advisorFacultyId, ApprovalStatus.PENDING)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * HOD sees all ADVISOR_APPROVED leaves for their department.
     * hod_id is NULL until the HOD actually acts — so we query by department + status.
     */
    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<LeaveResponse> getPendingForHod(Long hodUserId) {
        User hod = userRepo.findById(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", hodUserId));
        Long deptId = hod.getDepartment() != null ? hod.getDepartment().getId() : null;
        if (deptId == null) {
            log.warn("HOD user {} has no department assigned", hodUserId);
            return List.of();
        }
        return leaveRepo.findPendingForHodByDepartment(deptId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LeaveResponse cancelLeave(Long leaveId, String studentEmail) {
        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request", leaveId));
        Student student = getStudentByEmail(studentEmail);
        if (!leave.getStudent().getId().equals(student.getId()))
            throw new BadRequestException("Not your leave request");
        if (leave.getStatus() != LeaveStatus.PENDING)
            throw new BadRequestException("Can only cancel pending requests");
        leave.setStatus(LeaveStatus.CANCELLED);
        return mapToResponse(leaveRepo.save(leave));
    }

    // ── Private helpers ──────────────────────────────────────

    /**
     * Notify the HOD of the student's department that a leave is ready for their review.
     */
    private void notifyHod(LeaveRequest leave) {
        Long deptId = leave.getStudent().getDepartment().getId();
        List<User> hods = userRepo.findByDepartmentIdAndRole(deptId, Role.HOD);
        if (hods.isEmpty()) {
            log.warn("No HOD found for department id={}", deptId);
            return;
        }
        hods.forEach(hod -> {
            notificationService.createNotification(hod.getId(),
                    "Leave Request Awaiting HOD Approval",
                    leave.getStudent().getUser().getName() + "'s "
                            + leave.getCategory().name().toLowerCase() + " leave ("
                            + leave.getFromDate() + " to " + leave.getToDate()
                            + ") is approved by mentor & advisor — needs your approval.",
                    "LEAVE", leave.getId(), "LEAVE_REQUEST");
            log.info("HOD {} notified about leave {}", hod.getEmail(), leave.getId());
        });
    }

    private void notifyStudent(LeaveRequest leave, String title, String message) {
        notificationService.createNotification(
                leave.getStudent().getUser().getId(),
                title, message, "LEAVE", leave.getId(), "LEAVE_REQUEST");
    }

    @Override
    @Transactional(readOnly = true)
    public void notifyParent(Long leaveId) {
        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request", leaveId));
        
        Student student = leave.getStudent();
        String parentPhone = student.getParentWhatsapp() != null ? student.getParentWhatsapp() : student.getParentPhone();
        
        if (parentPhone != null && !parentPhone.isBlank()) {
            // Check if automation is possible
            if (!whatsAppService.isConfigured()) {
                throw new com.permithub.exception.BadRequestException("WhatsApp/SMS automation not configured. Please set API keys in application.properties or use manual option.");
            }
            
            String status = leave.getStatus() == LeaveStatus.REJECTED ? "rejected" : "approved";
            String dates = leave.getFromDate() + " to " + leave.getToDate();
            log.info("Automated notification to parent {} for student {}", parentPhone, student.getUser().getName());
            whatsAppService.sendLeaveNotification(parentPhone, student.getUser().getName(), status, dates);
        } else {
            throw new com.permithub.exception.BadRequestException("No parent phone number found for this student.");
        }
    }

    // ── Response mapping ─────────────────────────────────────
    @Override
    public LeaveResponse mapToResponse(LeaveRequest l) {
        return LeaveResponse.builder()
                .id(l.getId())
                .studentId(l.getStudent().getId())
                .studentName(l.getStudent().getUser().getName())
                .registerNumber(l.getStudent().getRegisterNumber())
                .departmentName(l.getStudent().getDepartment().getName())
                .year(l.getStudent().getYear())
                .section(l.getStudent().getSection())
                .category(l.getCategory() != null ? l.getCategory().name() : null)
                .fromDate(l.getFromDate()).toDate(l.getToDate())
                .totalDays(l.getTotalDays()).reason(l.getReason())
                .isEmergency(Boolean.TRUE.equals(l.getIsEmergency()))
                .certificate(l.getMedicalCertificate())
                .status(l.getStatus() != null ? l.getStatus().name() : null)
                .mentorName(l.getMentor() != null ? l.getMentor().getUser().getName() : null)
                .mentorStatus(l.getMentorStatus() != null ? l.getMentorStatus().name() : null)
                .mentorRemarks(l.getMentorRemarks()).mentorActionAt(l.getMentorActionAt())
                .advisorName(l.getAdvisor() != null ? l.getAdvisor().getUser().getName() : null)
                .advisorStatus(l.getAdvisorStatus() != null ? l.getAdvisorStatus().name() : null)
                .advisorRemarks(l.getAdvisorRemarks()).advisorActionAt(l.getAdvisorActionAt())
                .hodName(l.getHod() != null ? l.getHod().getName() : null)
                .hodStatus(l.getHodStatus() != null ? l.getHodStatus().name() : null)
                .hodRemarks(l.getHodRemarks()).hodActionAt(l.getHodActionAt())
                .rejectedBy(l.getRejectedBy()).rejectionReason(l.getRejectionReason())
                .createdAt(l.getCreatedAt())
                .parentWhatsapp(l.getStudent().getParentWhatsapp() != null
                        ? l.getStudent().getParentWhatsapp()
                        : l.getStudent().getParentPhone())
                .build();
    }
}
