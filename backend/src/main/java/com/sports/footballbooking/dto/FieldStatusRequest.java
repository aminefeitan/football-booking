package com.sports.footballbooking.dto;

import com.sports.footballbooking.entity.Field;
import jakarta.validation.constraints.NotNull;

public record FieldStatusRequest(
        @NotNull Field.FieldStatus status
) {}
