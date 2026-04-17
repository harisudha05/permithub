package com.permithub.service;
import com.permithub.dto.request.*;
import com.permithub.dto.response.ApiResponse;
import com.permithub.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse getProfile(String email);
    ApiResponse<Void> changePassword(String email, ChangePasswordRequest request);
    ApiResponse<String> forgotPassword(String email);
    ApiResponse<Void> resetPassword(String token, String newPassword);
}
