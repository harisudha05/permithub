package com.permithub.entity;

import com.permithub.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaveRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveCategory category;

    @Column(name = "from_date", nullable = false)
    private LocalDate fromDate;

    @Column(name = "to_date", nullable = false)
    private LocalDate toDate;

    @Column(name = "total_days", nullable = false)
    private Integer totalDays;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_emergency")
    @Builder.Default
    private Boolean isEmergency = false;

    @Column(name = "medical_certificate", length = 500)
    private String medicalCertificate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING;

    // Mentor
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id")
    private FacultyDetails mentor;

    @Enumerated(EnumType.STRING)
    @Column(name = "mentor_status")
    @Builder.Default
    private ApprovalStatus mentorStatus = ApprovalStatus.PENDING;

    @Column(name = "mentor_remarks", columnDefinition = "TEXT")
    private String mentorRemarks;

    @Column(name = "mentor_action_at")
    private LocalDateTime mentorActionAt;

    // Class Advisor
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "advisor_id")
    private FacultyDetails advisor;

    @Enumerated(EnumType.STRING)
    @Column(name = "advisor_status")
    @Builder.Default
    private ApprovalStatus advisorStatus = ApprovalStatus.PENDING;

    @Column(name = "advisor_remarks", columnDefinition = "TEXT")
    private String advisorRemarks;

    @Column(name = "advisor_action_at")
    private LocalDateTime advisorActionAt;

    // HOD
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hod_id")
    private User hod;

    @Enumerated(EnumType.STRING)
    @Column(name = "hod_status")
    @Builder.Default
    private ApprovalStatus hodStatus = ApprovalStatus.PENDING;

    @Column(name = "hod_remarks", columnDefinition = "TEXT")
    private String hodRemarks;

    @Column(name = "hod_action_at")
    private LocalDateTime hodActionAt;

    @Column(name = "rejected_by", length = 20)
    private String rejectedBy;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
