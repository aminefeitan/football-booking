package com.sports.footballbooking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTeamRequest(
        @NotBlank @Size(min = 2, max = 100) String name,
        String description
) {}
