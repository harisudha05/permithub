package com.permithub.repository;

import com.permithub.entity.LeaveRequest;
import com.permithub.enums.ApprovalStatus;
import com.permithub.enums.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<LeaveRequest> findByStudentIdInOrderByCreatedAtDesc(List<Long> ids);
    List<LeaveRequest> findByStudentIdAndStatus(Long studentId, LeaveStatus status);
    List<LeaveRequest> findByMentorIdAndMentorStatus(Long mentorId, ApprovalStatus status);
    List<LeaveRequest> findByAdvisorIdAndAdvisorStatus(Long advisorId, ApprovalStatus status);

    // HOD sees all ADVISOR_APPROVED leaves for their department (hod_id is NULL until HOD acts)
    @Query("SELECT l FROM LeaveRequest l WHERE l.student.department.id = :deptId AND l.status = 'ADVISOR_APPROVED' AND l.hodStatus = 'PENDING'")
    List<LeaveRequest> findPendingForHodByDepartment(@Param("deptId") Long deptId);

    // All leaves for HOD department (for reports/history)
    @Query("SELECT l FROM LeaveRequest l WHERE l.student.department.id = :deptId ORDER BY l.createdAt DESC")
    List<LeaveRequest> findAllByDepartment(@Param("deptId") Long deptId);

    @Query("SELECT COUNT(l) FROM LeaveRequest l WHERE l.student.id = :studentId AND l.status = 'HOD_APPROVED' AND l.semester.id = :semId")
    int countApprovedLeavesBySemester(@Param("studentId") Long studentId, @Param("semId") Long semId);

    @Query("SELECT l FROM LeaveRequest l WHERE l.student.department.id = :deptId AND l.createdAt BETWEEN :from AND :to")
    List<LeaveRequest> findByDepartmentAndDateRange(@Param("deptId") Long deptId,
        @Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    boolean existsByStudentIdAndFromDateLessThanEqualAndToDateGreaterThanEqualAndStatusNot(
        Long studentId, LocalDate toDate, LocalDate fromDate, LeaveStatus status);
}
