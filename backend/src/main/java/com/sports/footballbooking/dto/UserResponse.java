package com.sports.footballbooking.dto;

import com.sports.footballbooking.entity.User;
import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String phone,
        User.Role role,
        User.Status status,
        boolean mustChangePassword,
        OffsetDateTime createdAt
) {
    public static UserResponse from(User user) {
        if (user == null) return null;
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.isMustChangePassword(),
                user.getCreatedAt()
        );
    }
}
