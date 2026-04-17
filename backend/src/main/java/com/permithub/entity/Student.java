package com.permithub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Student {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "register_number", nullable = false, unique = true, length = 30)
    private String registerNumber;

    @Column(name = "roll_number", length = 20)
    private String rollNumber;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false, length = 5)
    private String section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_mentor_id")
    private FacultyDetails currentMentor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_advisor_id")
    private FacultyDetails classAdvisor;

    @Column(name = "is_hosteler")
    @Builder.Default
    private Boolean isHosteler = false;

    @Column(name = "hostel_name", length = 100)
    private String hostelName;

    @Column(name = "room_number", length = 20)
    private String roomNumber;

    @Column(name = "parent_name", length = 100)
    private String parentName;

    @Column(name = "parent_phone", length = 15)
    private String parentPhone;

    @Column(name = "parent_email", length = 150)
    private String parentEmail;

    @Column(name = "parent_whatsapp", length = 15)
    private String parentWhatsapp;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    private LocalDate dob;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
