package com.permithub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_details")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FacultyDetails {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "employee_id", unique = true, length = 30)
    private String employeeId;

    @Column(length = 100)
    private String designation;

    @Column(name = "is_mentor")
    @Builder.Default
    private Boolean isMentor = false;

    @Column(name = "is_class_advisor")
    @Builder.Default
    private Boolean isClassAdvisor = false;

    @Column(name = "is_event_coordinator")
    @Builder.Default
    private Boolean isEventCoordinator = false;

    @Column(name = "advisor_year")
    private Integer advisorYear;

    @Column(name = "advisor_section", length = 5)
    private String advisorSection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "advisor_department_id")
    private Department advisorDepartment;

    @Column(name = "event_types", columnDefinition = "JSON")
    private String eventTypes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
