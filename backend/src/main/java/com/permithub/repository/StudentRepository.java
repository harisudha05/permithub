package com.permithub.repository;

import com.permithub.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUserId(Long userId);
    Optional<Student> findByRegisterNumber(String registerNumber);
    List<Student> findByCurrentMentorId(Long mentorId);
    List<Student> findByClassAdvisorId(Long advisorId);
    List<Student> findByDepartmentIdAndYearAndSection(Long deptId, Integer year, String section);
    List<Student> findByDepartmentId(Long deptId);

    @Query("SELECT s FROM Student s WHERE s.currentMentor.id = :mentorId AND s.department.id = :deptId")
    List<Student> findMenteesByDepartment(@Param("mentorId") Long mentorId, @Param("deptId") Long deptId);
}
