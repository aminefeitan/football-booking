package com.sports.footballbooking.dto;

import java.util.UUID;

public record TeamSummaryResponse(
        UUID id,
        String name
) {}
