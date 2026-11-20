package com.sports.footballbooking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateBookingRequest(
        @NotNull UUID matchId,
        @NotNull UUID fieldId,
        @Size(max = 1000) String notes
) {}
