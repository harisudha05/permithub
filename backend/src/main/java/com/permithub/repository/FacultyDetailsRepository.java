package com.permithub.repository;

import com.permithub.entity.FacultyDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyDetailsRepository extends JpaRepository<FacultyDetails, Long> {
    Optional<FacultyDetails> findByUserId(Long userId);
    List<FacultyDetails> findByIsMentorTrue();
    List<FacultyDetails> findByIsClassAdvisorTrue();
    List<FacultyDetails> findByIsEventCoordinatorTrue();
    List<FacultyDetails> findByAdvisorDepartmentIdAndAdvisorYearAndAdvisorSection(Long deptId, Integer year, String section);
}
