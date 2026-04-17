package com.permithub.dto.response;
import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private Long userId;
    private String name;
    private String email;
    private Boolean isFirstLogin;
    private String profilePic;
    private String departmentName;
    private String message;
}
