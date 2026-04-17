package com.permithub.dto.request;
import lombok.Data;

@Data
public class ParentApprovalRequest {
    public boolean approved;
    public String remarks;
}
