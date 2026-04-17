package com.permithub.dto.request;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank public String token;
    @NotBlank public String newPassword;
}
