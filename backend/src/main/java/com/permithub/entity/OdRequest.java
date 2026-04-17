package com.permithub.entity;

import com.permithub.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "od_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OdRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private OdEventType eventType;

    @Column(name = "event_name", nullable = false, length = 200)
    private String eventName;

    @Column(length = 200)
    private String organizer;

    @Column(name = "from_date", nullable = false)
    private LocalDate fromDate;

    @Column(name = "to_date", nullable = false)
    private LocalDate toDate;

    @Column(name = "total_days", nullable = false)
    private Integer totalDays;

    @Column(length = 300)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "proof_document", length = 500)
    private String proofDocument;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OdStatus status = OdStatus.PENDING;

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

    // Coordinator
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coordinator_id")
    private FacultyDetails coordinator;

    @Enumerated(EnumType.STRING)
    @Column(name = "coordinator_status")
    @Builder.Default
    private ApprovalStatus coordinatorStatus = ApprovalStatus.PENDING;

    @Column(name = "coordinator_remarks", columnDefinition = "TEXT")
    private String coordinatorRemarks;

    @Column(name = "coordinator_action_at")
    private LocalDateTime coordinatorActionAt;

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
