package com.sports.footballbooking.dto;

import com.sports.footballbooking.entity.User;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull User.Role role
) {}
