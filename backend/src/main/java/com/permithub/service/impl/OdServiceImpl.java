package com.permithub.service.impl;

import com.permithub.dto.request.ApprovalRequest;
import com.permithub.dto.request.OdRequestDto;
import com.permithub.dto.response.OdResponse;
import com.permithub.entity.*;
import com.permithub.enums.ApprovalStatus;
import com.permithub.enums.OdStatus;
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

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OdServiceImpl implements OdService {

    private final OdRequestRepository odRepo;
    private final StudentRepository studentRepo;
    private final FacultyDetailsRepository facultyRepo;
    private final SemesterRepository semesterRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;

    private Student getStudentByEmail(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return studentRepo.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
    }

    @Override
    @Transactional
    public OdResponse applyOd(String studentEmail, OdRequestDto request, MultipartFile proof) {
        Student student = getStudentByEmail(studentEmail);
        Semester semester = semesterRepo.findByIsActiveTrue()
                .orElseThrow(() -> new BadRequestException("No active semester"));

        if (request.getToDate().isBefore(request.getFromDate()))
            throw new BadRequestException("End date must be after start date");
        int totalDays = (int) ChronoUnit.DAYS.between(request.getFromDate(), request.getToDate()) + 1;
        if (totalDays > 15) throw new BadRequestException("OD cannot exceed 15 days");

        String proofPath = null;
        if (proof != null && !proof.isEmpty()) proofPath = fileStorageService.storeFile(proof, "od-proofs");

        FacultyDetails mentor = student.getCurrentMentor();
        FacultyDetails advisor = student.getClassAdvisor();
        // Find coordinator by event type AND same department
        FacultyDetails coordinator = findCoordinator(request.getEventType().name(), student.getDepartment().getId());

        log.info("OD apply: student={}, eventType={}, deptId={}, coordinator={}",
                student.getUser().getName(), request.getEventType().name(),
                student.getDepartment().getId(),
                coordinator != null ? coordinator.getUser().getName() : "NONE");

        // Build description combining reason and description
        String fullDescription = request.getReason() != null ? request.getReason() : "";
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            fullDescription += (fullDescription.isBlank() ? "" : " | ") + request.getDescription();
        }

        OdRequest od = OdRequest.builder()
                .student(student).semester(semester)
                .eventType(request.getEventType()).eventName(request.getEventName())
                .organizer(request.getOrganizer()).fromDate(request.getFromDate())
                .toDate(request.getToDate()).totalDays(totalDays)
                .location(request.getLocation()).description(fullDescription)
                .proofDocument(proofPath).status(OdStatus.PENDING)
                .mentor(mentor).mentorStatus(ApprovalStatus.PENDING)
                .coordinator(coordinator).coordinatorStatus(ApprovalStatus.PENDING)
                .advisor(advisor).advisorStatus(ApprovalStatus.PENDING)
                .build();

        od = odRepo.save(od);

        // Notify mentor
        if (mentor != null) {
            notificationService.createNotification(mentor.getUser().getId(), "New OD Request",
                    student.getUser().getName() + " applied for OD: " + request.getEventName(),
                    "OD", od.getId(), "OD_REQUEST");
        }

        return mapToResponse(od);
    }

    @Override
    @Transactional
    public OdResponse mentorAction(Long odId, String mentorEmail, ApprovalRequest request) {
        OdRequest od = odRepo.findById(odId)
                .orElseThrow(() -> new ResourceNotFoundException("OD request", odId));
        User mentorUser = userRepo.findByEmail(mentorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        FacultyDetails mentor = facultyRepo.findByUserId(mentorUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (od.getMentorStatus() != ApprovalStatus.PENDING) throw new BadRequestException("Already actioned by mentor");

        od.setMentorStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        od.setMentorRemarks(request.getRemarks());
        od.setMentorActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            od.setStatus(OdStatus.REJECTED);
            od.setRejectedBy("MENTOR");
            notifyStudent(od, "OD Request Rejected by Mentor",
                    "Your OD for " + od.getEventName() + " was rejected by mentor.");
        } else {
            od.setStatus(OdStatus.MENTOR_APPROVED);
            FacultyDetails coordinator = od.getCoordinator();
            FacultyDetails advisor = od.getAdvisor();

            boolean mentorIsCoord = coordinator != null && coordinator.getId().equals(mentor.getId());
            boolean mentorIsAdvisor = advisor != null && advisor.getId().equals(mentor.getId());

            if (mentorIsCoord && mentorIsAdvisor) {
                // Same person is mentor + coordinator + advisor
                autoApproveCoordinator(od);
                autoApproveAdvisor(od);
                od.setStatus(OdStatus.ADVISOR_APPROVED);
                notifyHod(od);
            } else if (mentorIsCoord) {
                // Same person is mentor + coordinator
                autoApproveCoordinator(od);
                od.setStatus(OdStatus.COORDINATOR_APPROVED);
                if (advisor != null && advisor.getId().equals(mentor.getId())) {
                    autoApproveAdvisor(od);
                    od.setStatus(OdStatus.ADVISOR_APPROVED);
                    notifyHod(od);
                } else if (advisor != null) {
                    notifyFaculty(advisor, "OD awaiting class advisor approval", od);
                }
            } else if (mentorIsAdvisor) {
                // Same person is mentor + advisor - still need coordinator
                if (coordinator != null) {
                    notifyFaculty(coordinator, "New OD request for your coordination", od);
                } else {
                    // No coordinator — skip to advisor step, auto-approve advisor too
                    autoApproveAdvisor(od);
                    od.setStatus(OdStatus.ADVISOR_APPROVED);
                    notifyHod(od);
                }
            } else {
                // All different people — notify coordinator first (or skip if none)
                if (coordinator != null) {
                    notifyFaculty(coordinator, "New OD request for coordination approval", od);
                } else {
                    // No coordinator — go directly to advisor
                    od.setStatus(OdStatus.COORDINATOR_APPROVED);
                    od.setCoordinatorStatus(ApprovalStatus.APPROVED);
                    od.setCoordinatorActionAt(LocalDateTime.now());
                    od.setCoordinatorRemarks("Auto-approved (no coordinator assigned)");
                    if (advisor != null) {
                        notifyFaculty(advisor, "OD awaiting class advisor approval", od);
                    } else {
                        od.setStatus(OdStatus.ADVISOR_APPROVED);
                        notifyHod(od);
                    }
                }
            }
        }
        return mapToResponse(odRepo.save(od));
    }

    @Override
    @Transactional
    public OdResponse coordinatorAction(Long odId, Long coordinatorUserId, ApprovalRequest request) {
        OdRequest od = odRepo.findById(odId)
                .orElseThrow(() -> new ResourceNotFoundException("OD request", odId));
        FacultyDetails coordinator = facultyRepo.findByUserId(coordinatorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (od.getMentorStatus() != ApprovalStatus.APPROVED) throw new BadRequestException("Mentor approval pending");
        if (od.getCoordinatorStatus() != ApprovalStatus.PENDING) throw new BadRequestException("Already actioned by coordinator");

        od.setCoordinatorStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        od.setCoordinatorRemarks(request.getRemarks());
        od.setCoordinatorActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            od.setStatus(OdStatus.REJECTED);
            od.setRejectedBy("COORDINATOR");
            notifyStudent(od, "OD Rejected by Coordinator", "Your OD was rejected by the event coordinator.");
        } else {
            od.setStatus(OdStatus.COORDINATOR_APPROVED);
            FacultyDetails advisor = od.getAdvisor();
            if (advisor != null && advisor.getId().equals(coordinator.getId())) {
                // Coordinator is also the class advisor
                autoApproveAdvisor(od);
                od.setStatus(OdStatus.ADVISOR_APPROVED);
                notifyHod(od);
            } else if (advisor != null) {
                notifyFaculty(advisor, "OD awaiting class advisor approval", od);
            } else {
                od.setStatus(OdStatus.ADVISOR_APPROVED);
                notifyHod(od);
            }
        }
        return mapToResponse(odRepo.save(od));
    }

    @Override
    @Transactional
    public OdResponse advisorAction(Long odId, Long advisorUserId, ApprovalRequest request) {
        OdRequest od = odRepo.findById(odId)
                .orElseThrow(() -> new ResourceNotFoundException("OD request", odId));
        if (od.getCoordinatorStatus() != ApprovalStatus.APPROVED) throw new BadRequestException("Coordinator approval pending");
        if (od.getAdvisorStatus() != ApprovalStatus.PENDING) throw new BadRequestException("Already actioned by advisor");

        od.setAdvisorStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        od.setAdvisorRemarks(request.getRemarks());
        od.setAdvisorActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            od.setStatus(OdStatus.REJECTED);
            od.setRejectedBy("ADVISOR");
            notifyStudent(od, "OD Rejected by Advisor", "Your OD was rejected by class advisor.");
        } else {
            od.setStatus(OdStatus.ADVISOR_APPROVED);
            notifyHod(od);
        }
        return mapToResponse(odRepo.save(od));
    }

    @Override
    @Transactional
    public OdResponse hodAction(Long odId, Long hodUserId, ApprovalRequest request) {
        OdRequest od = odRepo.findById(odId)
                .orElseThrow(() -> new ResourceNotFoundException("OD request", odId));
        if (od.getAdvisorStatus() != ApprovalStatus.APPROVED) throw new BadRequestException("Advisor approval pending");
        if (od.getHodStatus() != ApprovalStatus.PENDING) throw new BadRequestException("Already actioned by HOD");

        User hod = userRepo.findById(hodUserId).orElseThrow(() -> new ResourceNotFoundException("User", hodUserId));
        od.setHod(hod);
        od.setHodStatus(request.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        od.setHodRemarks(request.getRemarks());
        od.setHodActionAt(LocalDateTime.now());

        if (!request.isApproved()) {
            od.setStatus(OdStatus.REJECTED);
            od.setRejectedBy("HOD");
            notifyStudent(od, "OD Rejected by HOD", "Your OD was rejected by the HOD.");
        } else {
            od.setStatus(OdStatus.HOD_APPROVED);
            notifyStudent(od, "OD Fully Approved!",
                    "Your OD for " + od.getEventName() + " (" + od.getFromDate() + " to " + od.getToDate() + ") is approved!");
            
            // Send Email notification (Free alternative to WhatsApp)
            if (od.getStudent().getUser().getEmail() != null) {
                log.info("Sending OD approval email to student/parent at {}", od.getStudent().getUser().getEmail());
                emailService.sendOdApprovalEmail(
                    od.getStudent().getUser().getEmail(),
                    od.getStudent().getUser().getName(),
                    "APPROVED",
                    od.getHodRemarks()
                );
            }
        }
        return mapToResponse(odRepo.save(od));
    }

    @Override
    public OdResponse getOdById(Long id) {
        return mapToResponse(odRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("OD request", id)));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OdResponse> getStudentOds(String studentEmail) {
        Student s = getStudentByEmail(studentEmail);
        return odRepo.findByStudentIdOrderByCreatedAtDesc(s.getId()).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OdResponse> getPendingForMentor(Long id) {
        return odRepo.findByMentorIdAndMentorStatus(id, ApprovalStatus.PENDING).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OdResponse> getPendingForCoordinator(Long id) {
        return odRepo.findByCoordinatorIdAndCoordinatorStatus(id, ApprovalStatus.PENDING).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OdResponse> getPendingForAdvisor(Long id) {
        return odRepo.findByAdvisorIdAndAdvisorStatus(id, ApprovalStatus.PENDING).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<OdResponse> getPendingForHod(Long hodUserId) {
        User hod = userRepo.findById(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", hodUserId));
        Long deptId = hod.getDepartment() != null ? hod.getDepartment().getId() : null;
        if (deptId == null) {
            log.warn("HOD user {} has no department assigned", hodUserId);
            return java.util.List.of();
        }
        // Query by department + ADVISOR_APPROVED status (hod_id is NULL until HOD acts)
        return odRepo.findPendingForHodByDepartment(deptId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelOd(Long odId, String studentEmail) {
        OdRequest od = odRepo.findById(odId).orElseThrow(() -> new ResourceNotFoundException("OD request", odId));
        if (od.getStatus() != OdStatus.PENDING) throw new BadRequestException("Can only cancel pending requests");
        od.setStatus(OdStatus.CANCELLED);
        odRepo.save(od);
    }

    // ── Helpers ────────────────────────────────────────────
    private void autoApproveCoordinator(OdRequest od) {
        od.setCoordinatorStatus(ApprovalStatus.APPROVED);
        od.setCoordinatorActionAt(LocalDateTime.now());
        od.setCoordinatorRemarks("Auto-approved (same as mentor)");
    }

    private void autoApproveAdvisor(OdRequest od) {
        od.setAdvisorStatus(ApprovalStatus.APPROVED);
        od.setAdvisorActionAt(LocalDateTime.now());
        od.setAdvisorRemarks("Auto-approved (same as mentor/coordinator)");
    }

    private void notifyFaculty(FacultyDetails f, String msg, OdRequest od) {
        if (f == null) return;
        notificationService.createNotification(f.getUser().getId(), "OD Request - Action Required",
                od.getStudent().getUser().getName() + ": " + msg + " — " + od.getEventName(),
                "OD", od.getId(), "OD_REQUEST");
    }

    private void notifyStudent(OdRequest od, String title, String msg) {
        notificationService.createNotification(od.getStudent().getUser().getId(),
                title, msg, "OD", od.getId(), "OD_REQUEST");
    }

    @Override
    @Transactional(readOnly = true)
    public void notifyParent(Long odId) {
        OdRequest od = odRepo.findById(odId)
                .orElseThrow(() -> new ResourceNotFoundException("OD request", odId));
        
        Student student = od.getStudent();
        String parentPhone = student.getParentWhatsapp() != null ? student.getParentWhatsapp() : student.getParentPhone();
        
        if (parentPhone != null && !parentPhone.isBlank()) {
            // Check if automation is possible
            if (!whatsAppService.isConfigured()) {
                throw new com.permithub.exception.BadRequestException("WhatsApp/SMS automation not configured. Please set API keys in application.properties or use manual option.");
            }
            
            String status = od.getStatus() == OdStatus.REJECTED ? "rejected" : "approved";
            String dates = od.getFromDate() + " to " + od.getToDate();
            log.info("Automated notification to parent {} for student {}", parentPhone, student.getUser().getName());
            whatsAppService.sendOdNotification(parentPhone, student.getUser().getName(), status, od.getEventName(), dates);
        } else {
            throw new com.permithub.exception.BadRequestException("No parent phone number found for this student.");
        }
    }

    private void notifyHod(OdRequest od) {
        userRepo.findByDepartmentIdAndRole(
                od.getStudent().getDepartment().getId(), com.permithub.enums.Role.HOD)
                .forEach(h -> notificationService.createNotification(h.getId(),
                        "OD Pending HOD Approval",
                        od.getStudent().getUser().getName() + "'s OD for " + od.getEventName() + " needs HOD approval",
                        "OD", od.getId(), "OD_REQUEST"));
    }

    /**
     * Find event coordinator for the given event type in the same department.
     * Supports multi-role faculty (e.g., mentor who is also a coordinator).
     * event_types column stores JSON like: ["HACKATHON","WORKSHOP"]
     */
    private FacultyDetails findCoordinator(String eventType, Long deptId) {
        return facultyRepo.findByIsEventCoordinatorTrue().stream()
                .filter(f -> {
                    // Must be in same department as student
                    boolean sameDept = f.getUser().getDepartment() != null &&
                                      f.getUser().getDepartment().getId().equals(deptId);
                    if (!sameDept) return false;
                    // event_types is JSON string: ["HACKATHON","CLUB_ACTIVITIES"]
                    String types = f.getEventTypes();
                    if (types == null || types.isBlank()) return false;
                    // Simple substring check works for JSON arrays of strings
                    return types.contains("\"" + eventType + "\"");
                })
                .findFirst()
                .orElse(null);
    }

    @Override
    public OdResponse mapToResponse(OdRequest o) {
        return OdResponse.builder()
                .id(o.getId()).studentId(o.getStudent().getId())
                .studentName(o.getStudent().getUser().getName())
                .registerNumber(o.getStudent().getRegisterNumber())
                .departmentName(o.getStudent().getDepartment().getName())
                .eventType(o.getEventType() != null ? o.getEventType().name() : null)
                .eventName(o.getEventName()).organizer(o.getOrganizer())
                .fromDate(o.getFromDate()).toDate(o.getToDate()).totalDays(o.getTotalDays())
                .location(o.getLocation()).description(o.getDescription()).proofDocument(o.getProofDocument())
                .status(o.getStatus() != null ? o.getStatus().name() : null)
                .mentorName(o.getMentor() != null ? o.getMentor().getUser().getName() : null)
                .mentorStatus(o.getMentorStatus() != null ? o.getMentorStatus().name() : null)
                .mentorRemarks(o.getMentorRemarks()).mentorActionAt(o.getMentorActionAt())
                .coordinatorName(o.getCoordinator() != null ? o.getCoordinator().getUser().getName() : null)
                .coordinatorStatus(o.getCoordinatorStatus() != null ? o.getCoordinatorStatus().name() : null)
                .coordinatorRemarks(o.getCoordinatorRemarks()).coordinatorActionAt(o.getCoordinatorActionAt())
                .advisorName(o.getAdvisor() != null ? o.getAdvisor().getUser().getName() : null)
                .advisorStatus(o.getAdvisorStatus() != null ? o.getAdvisorStatus().name() : null)
                .advisorRemarks(o.getAdvisorRemarks()).advisorActionAt(o.getAdvisorActionAt())
                .hodStatus(o.getHodStatus() != null ? o.getHodStatus().name() : null)
                .hodRemarks(o.getHodRemarks()).hodActionAt(o.getHodActionAt())
                .rejectedBy(o.getRejectedBy()).createdAt(o.getCreatedAt())
                .parentWhatsapp(o.getStudent().getParentWhatsapp() != null
                        ? o.getStudent().getParentWhatsapp()
                        : o.getStudent().getParentPhone())
                .build();
    }
}
