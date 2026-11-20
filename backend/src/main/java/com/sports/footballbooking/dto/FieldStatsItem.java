package com.sports.footballbooking.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FieldStatsItem(
        UUID fieldId,
        String fieldName,
        long confirmedBookings,
        BigDecimal revenue
) {}
