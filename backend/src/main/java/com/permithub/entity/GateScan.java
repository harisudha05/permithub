package com.permithub.entity;

import com.permithub.enums.ScanType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "gate_scans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GateScan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outpass_id", nullable = false)
    private OutpassRequest outpass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "security_id", nullable = false)
    private User security;

    @Enumerated(EnumType.STRING)
    @Column(name = "scan_type", nullable = false)
    private ScanType scanType;

    @Column(name = "scan_time")
    private LocalDateTime scanTime;

    @Column(name = "is_late")
    @Builder.Default
    private Boolean isLate = false;

    @Column(name = "late_minutes")
    @Builder.Default
    private Integer lateMinutes = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Raw QR payload scanned at the gate (useful for Excel logs / auditing).
    @Column(name = "qr_payload", columnDefinition = "TEXT")
    private String qrPayload;
}
