package com.permithub.dto.request;
import com.permithub.enums.LeaveCategory;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class LeaveRequestDto {
    @NotNull public LeaveCategory category;
    @NotNull public LocalDate fromDate;
    @NotNull public LocalDate toDate;
    @NotBlank public String reason;
    public String description; // optional
    public boolean isEmergency;
}
