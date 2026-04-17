package com.permithub.service;
import com.permithub.dto.request.*;
import com.permithub.dto.response.LeaveResponse;
import com.permithub.entity.LeaveRequest;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface LeaveService {
    LeaveResponse applyLeave(String email, LeaveRequestDto request, MultipartFile certificate);
    LeaveResponse getLeaveById(Long id);
    List<LeaveResponse> getStudentLeaves(String email);
    List<LeaveResponse> getPendingForMentor(Long mentorFacultyId);
    List<LeaveResponse> getPendingForAdvisor(Long advisorFacultyId);
    List<LeaveResponse> getPendingForHod(Long hodUserId);   // hodUserId used to find dept
    LeaveResponse mentorAction(Long leaveId, String mentorEmail, ApprovalRequest request);
    LeaveResponse advisorAction(Long leaveId, Long advisorUserId, ApprovalRequest request);
    LeaveResponse hodAction(Long leaveId, Long hodUserId, ApprovalRequest request);
    void notifyParent(Long leaveId);
    LeaveResponse cancelLeave(Long leaveId, String studentEmail);
    LeaveResponse mapToResponse(LeaveRequest leave);
}
