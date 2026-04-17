package com.permithub.entity;

import com.permithub.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "outpass_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OutpassRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "out_datetime", nullable = false)
    private LocalDateTime outDatetime;

    @Column(name = "return_datetime", nullable = false)
    private LocalDateTime returnDatetime;

    // Actual gate times captured by Security scan
    @Column(name = "actual_out_time")
    private LocalDateTime actualOutTime;

    @Column(name = "actual_in_time")
    private LocalDateTime actualInTime;

    @Column(name = "duration_hours", precision = 5, scale = 2)
    private BigDecimal durationHours;

    @Column(nullable = false, length = 300)
    private String destination;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "emergency_contact", length = 15)
    private String emergencyContact;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OutpassStatus status = OutpassStatus.PENDING;

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

    // Parent
    @Column(name = "parent_token", unique = true)
    private String parentToken;

    @Column(name = "parent_token_expiry")
    private LocalDateTime parentTokenExpiry;

    @Enumerated(EnumType.STRING)
    @Column(name = "parent_status")
    private ApprovalStatus parentStatus;

    @Column(name = "parent_remarks", columnDefinition = "TEXT")
    private String parentRemarks;

    @Column(name = "parent_action_at")
    private LocalDateTime parentActionAt;

    // Advisor
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

    // Warden
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warden_id")
    private User warden;

    @Enumerated(EnumType.STRING)
    @Column(name = "warden_status")
    @Builder.Default
    private ApprovalStatus wardenStatus = ApprovalStatus.PENDING;

    @Column(name = "warden_remarks", columnDefinition = "TEXT")
    private String wardenRemarks;

    @Column(name = "warden_action_at")
    private LocalDateTime wardenActionAt;

    // AO
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ao_id")
    private User ao;

    @Enumerated(EnumType.STRING)
    @Column(name = "ao_status")
    @Builder.Default
    private ApprovalStatus aoStatus = ApprovalStatus.PENDING;

    @Column(name = "ao_remarks", columnDefinition = "TEXT")
    private String aoRemarks;

    @Column(name = "ao_action_at")
    private LocalDateTime aoActionAt;

    // Principal
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "principal_id")
    private User principal;

    @Enumerated(EnumType.STRING)
    @Column(name = "principal_status")
    @Builder.Default
    private ApprovalStatus principalStatus = ApprovalStatus.PENDING;

    @Column(name = "principal_remarks", columnDefinition = "TEXT")
    private String principalRemarks;

    @Column(name = "principal_action_at")
    private LocalDateTime principalActionAt;

    // QR
    @Column(name = "qr_code", length = 500)
    private String qrCode;

    @Column(name = "qr_generated_at")
    private LocalDateTime qrGeneratedAt;

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
