package com.permithub.dto.response;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class OdResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String registerNumber;
    private String departmentName;
    private String eventType;
    private String eventName;
    private String organizer;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Integer totalDays;
    private String location;
    private String description;
    private String proofDocument;
    private String status;
    private String mentorName;
    private String mentorStatus;
    private String mentorRemarks;
    private LocalDateTime mentorActionAt;
    private String coordinatorName;
    private String coordinatorStatus;
    private String coordinatorRemarks;
    private LocalDateTime coordinatorActionAt;
    private String advisorName;
    private String advisorStatus;
    private String advisorRemarks;
    private LocalDateTime advisorActionAt;
    private String hodStatus;
    private String hodRemarks;
    private LocalDateTime hodActionAt;
    private String rejectedBy;
    private LocalDateTime createdAt;
    private String parentWhatsapp;
}
