package com.permithub.repository;

import com.permithub.entity.OdRequest;
import com.permithub.enums.ApprovalStatus;
import com.permithub.enums.OdStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OdRequestRepository extends JpaRepository<OdRequest, Long> {

    List<OdRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<OdRequest> findByStudentIdInOrderByCreatedAtDesc(List<Long> ids);
    List<OdRequest> findByStudentIdAndStatus(Long studentId, OdStatus status);
    List<OdRequest> findByMentorIdAndMentorStatus(Long mentorId, ApprovalStatus status);
    List<OdRequest> findByCoordinatorIdAndCoordinatorStatus(Long coordinatorId, ApprovalStatus status);
    List<OdRequest> findByAdvisorIdAndAdvisorStatus(Long advisorId, ApprovalStatus status);

    // HOD sees ADVISOR_APPROVED ODs for their department (hod_id is NULL until HOD acts)
    @Query("SELECT o FROM OdRequest o WHERE o.student.department.id = :deptId AND o.status = 'ADVISOR_APPROVED' AND o.hodStatus = 'PENDING'")
    List<OdRequest> findPendingForHodByDepartment(@Param("deptId") Long deptId);

    // All ODs for department
    @Query("SELECT o FROM OdRequest o WHERE o.student.department.id = :deptId ORDER BY o.createdAt DESC")
    List<OdRequest> findAllByDepartment(@Param("deptId") Long deptId);

    List<OdRequest> findByStudentDepartmentId(Long deptId);
}
