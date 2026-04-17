package com.permithub.repository;

import com.permithub.entity.OutpassRequest;
import com.permithub.enums.ApprovalStatus;
import com.permithub.enums.OutpassStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutpassRequestRepository extends JpaRepository<OutpassRequest, Long> {
    List<OutpassRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<OutpassRequest> findByStudentIdInOrderByCreatedAtDesc(List<Long> ids);
    Optional<OutpassRequest> findByParentToken(String token);
    List<OutpassRequest> findByMentorIdAndMentorStatus(Long mentorId, ApprovalStatus status);
    List<OutpassRequest> findByAdvisorIdAndAdvisorStatus(Long advisorId, ApprovalStatus status);
    List<OutpassRequest> findByWardenIdAndWardenStatus(Long wardenId, ApprovalStatus status);
    List<OutpassRequest> findByAoIdAndAoStatus(Long aoId, ApprovalStatus status);
    List<OutpassRequest> findByPrincipalIdAndPrincipalStatus(Long principalId, ApprovalStatus status);
    List<OutpassRequest> findByStatus(OutpassStatus status);
    // Role-level pending queues (since warden/ao/principal are assigned only when they act)
    List<OutpassRequest> findByStatusAndWardenStatus(OutpassStatus status, ApprovalStatus wardenStatus);
    List<OutpassRequest> findByStatusAndAoStatus(OutpassStatus status, ApprovalStatus aoStatus);
    List<OutpassRequest> findByStatusAndPrincipalStatus(OutpassStatus status, ApprovalStatus principalStatus);
    // HOD: all outpasses for department
    List<OutpassRequest> findByStudentDepartmentIdOrderByCreatedAtDesc(Long departmentId);
    // Advisor pending: parent approved, advisor still pending
    List<OutpassRequest> findByAdvisorIdAndAdvisorStatusAndParentStatus(Long advisorId, ApprovalStatus advisorStatus, ApprovalStatus parentStatus);
}
