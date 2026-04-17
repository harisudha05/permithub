package com.permithub.service;
import com.permithub.dto.request.*;
import com.permithub.dto.response.OdResponse;
import com.permithub.entity.OdRequest;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface OdService {
    OdResponse applyOd(String studentEmail, OdRequestDto request, MultipartFile proof);
    OdResponse getOdById(Long id);
    List<OdResponse> getStudentOds(String studentEmail);
    List<OdResponse> getPendingForMentor(Long mentorFacultyId);
    List<OdResponse> getPendingForCoordinator(Long coordinatorFacultyId);
    List<OdResponse> getPendingForAdvisor(Long advisorFacultyId);
    List<OdResponse> getPendingForHod(Long hodUserId);
    OdResponse mentorAction(Long odId, String mentorEmail, ApprovalRequest request);
    OdResponse coordinatorAction(Long odId, Long coordinatorUserId, ApprovalRequest request);
    OdResponse advisorAction(Long odId, Long advisorUserId, ApprovalRequest request);
    OdResponse hodAction(Long odId, Long hodUserId, ApprovalRequest request);
    void notifyParent(Long odId);
    void cancelOd(Long odId, String studentEmail);
    OdResponse mapToResponse(OdRequest od);
}
