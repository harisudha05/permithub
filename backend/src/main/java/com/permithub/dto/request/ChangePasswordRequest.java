package com.permithub.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
public class ChangePasswordRequest {
    @NotBlank
    private String currentPassword;
    @NotBlank @Size(min = 8)
    private String newPassword;
    @NotBlank
    private String confirmPassword;
}
