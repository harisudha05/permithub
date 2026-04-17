package com.permithub.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter
public class OutpassRequestDto {
    @NotNull
    private LocalDateTime outDatetime;
    @NotNull
    private LocalDateTime returnDatetime;
    @NotBlank
    private String destination;
    @NotBlank
    private String reason;
    private String emergencyContact;
}
