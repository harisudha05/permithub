package com.permithub.service;
import com.permithub.dto.request.*;
import com.permithub.dto.response.OutpassResponse;
import java.util.List;

public interface OutpassService {
    OutpassResponse applyOutpass(Long studentUserId, OutpassRequestDto request);
    OutpassResponse getOutpassById(Long id);
    List<OutpassResponse> getStudentOutpasses(Long studentUserId);
    List<OutpassResponse> getPendingForMentor(Long mentorUserId);
    List<OutpassResponse> getPendingForAdvisor(Long advisorUserId);
    List<OutpassResponse> getPendingForWarden(Long wardenUserId);
    List<OutpassResponse> getPendingForAo(Long aoUserId);
    List<OutpassResponse> getPendingForPrincipal(Long principalUserId);
    OutpassResponse mentorAction(Long outpassId, Long mentorUserId, ApprovalRequest request);
    OutpassResponse parentAction(String token, ParentApprovalRequest request);
    OutpassResponse advisorAction(Long outpassId, Long advisorUserId, ApprovalRequest request);
    OutpassResponse wardenAction(Long outpassId, Long wardenUserId, ApprovalRequest request);
    OutpassResponse aoAction(Long outpassId, Long aoUserId, ApprovalRequest request);
    OutpassResponse principalAction(Long outpassId, Long principalUserId, ApprovalRequest request);
    OutpassResponse getByParentToken(String token);
    OutpassResponse processQrScan(String qrContent, Long securityUserId);
    OutpassResponse mapToResponse(com.permithub.entity.OutpassRequest outpass);
}
