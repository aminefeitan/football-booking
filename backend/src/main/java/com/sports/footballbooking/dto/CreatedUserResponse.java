package com.sports.footballbooking.dto;

public record CreatedUserResponse(
        UserResponse user,
        String temporaryPassword
) {
}
