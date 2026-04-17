package com.permithub.dto.response;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class LeaveResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String registerNumber;
    private Integer year;
    private String section;
    private String departmentName;
    private String category;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Integer totalDays;
    private String reason;
    private String certificate;
    private Boolean isEmergency;
    private String status;
    private String mentorName;
    private String mentorStatus;
    private String mentorRemarks;
    private LocalDateTime mentorActionAt;
    private String advisorName;
    private String advisorStatus;
    private String advisorRemarks;
    private LocalDateTime advisorActionAt;
    private String hodName;
    private String hodStatus;
    private String hodRemarks;
    private LocalDateTime hodActionAt;
    private String rejectedBy;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private String parentWhatsapp;
}
