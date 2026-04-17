package com.permithub.dto.request;
import com.permithub.enums.OdEventType;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter
public class OdRequestDto {
    @NotNull private OdEventType eventType;
    @NotBlank private String eventName;
    private String reason; // dropdown selected reason
    private String organizer;
    @NotNull private LocalDate fromDate;
    @NotNull private LocalDate toDate;
    private String location;
    private String description; // optional additional details
    private String proofDocument;
}
