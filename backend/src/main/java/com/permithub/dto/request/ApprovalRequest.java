package com.permithub.dto.request;
import lombok.*;
@Getter @Setter
public class ApprovalRequest {
    private boolean approved;
    private String remarks;
}
