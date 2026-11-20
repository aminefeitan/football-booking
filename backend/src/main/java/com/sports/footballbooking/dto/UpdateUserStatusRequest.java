package com.sports.footballbooking.dto;

import com.sports.footballbooking.entity.User;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull User.Status status
) {}
