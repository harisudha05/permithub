package com.permithub.dto.response;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class StudentResponse {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String registerNumber;
    private String rollNumber;
    private Integer year;
    private String section;
    private String departmentName;
    private String departmentCode;
    private String mentorName;
    private String advisorName;
    private Boolean isHosteler;
    private String hostelName;
    private String roomNumber;
    private String parentName;
    private String parentPhone;
    private String parentWhatsapp;
    private String bloodGroup;
    private String profilePic;
    private Integer leaveBalance;
    private Integer usedLeaves;
    private LocalDateTime createdAt;
}
