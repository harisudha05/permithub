package com.permithub.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class SemesterRequest {
    @NotBlank public String name;
    @NotNull public LocalDate startDate;
    @NotNull public LocalDate endDate;
    public Integer defaultLeaveLimit = 20;
    public String academicYear;
}
