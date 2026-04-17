package com.permithub.dto.response;
import com.permithub.enums.ScanType;
import lombok.*;
import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class GateScanResponse {
    private Long id;
    private Long outpassId;
    private String studentName;
    private String registerNumber;
    private String department;
    private ScanType scanType;
    private LocalDateTime scanTime;
    private boolean isLate;
    private Integer lateMinutes;
    private String destination;
    private LocalDateTime returnDatetime;
    private boolean valid;
    private String validationMessage;
}
