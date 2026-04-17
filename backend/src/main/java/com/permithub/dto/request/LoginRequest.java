package com.permithub.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter
public class LoginRequest {
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min=6)
    private String password;
    private boolean rememberMe;
}
