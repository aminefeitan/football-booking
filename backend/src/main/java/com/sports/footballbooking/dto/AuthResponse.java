package com.sports.footballbooking.dto;

public record AuthResponse(
        String token,
        UserResponse user
) {}
