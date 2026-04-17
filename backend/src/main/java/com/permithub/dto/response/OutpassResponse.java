package com.permithub.dto.response;
import com.permithub.enums.ApprovalStatus;
import com.permithub.enums.OutpassStatus;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class OutpassResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String registerNumber;
    private String department;
    private String hostelName;
    private String roomNumber;
    private String parentPhone;
    private String parentWhatsapp;
    private LocalDateTime outDatetime;
    private LocalDateTime returnDatetime;
    private LocalDateTime actualOutTime;
    private LocalDateTime actualInTime;
    private Double durationHours;
    private String destination;
    private String reason;
    private String emergencyContact;
    private OutpassStatus status;
    private ApprovalStatus mentorStatus;
    private String mentorRemarks;
    private LocalDateTime mentorActionAt;
    private ApprovalStatus parentStatus;
    private String parentRemarks;
    private String parentToken;
    private LocalDateTime parentActionAt;
    private ApprovalStatus advisorStatus;
    private String advisorRemarks;
    private LocalDateTime advisorActionAt;
    private ApprovalStatus wardenStatus;
    private String wardenRemarks;
    private ApprovalStatus aoStatus;
    private String aoRemarks;
    private ApprovalStatus principalStatus;
    private String principalRemarks;
    private String qrCode;
    private LocalDateTime createdAt;

    // Used by Security scan endpoint UI
    private String scanType; // EXIT or ENTRY
    private Boolean isLate;
    private Integer lateMinutes;
    private LocalDateTime scanTime;
}
