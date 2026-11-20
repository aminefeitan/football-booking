package com.sports.footballbooking.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ManagerStatsResponse(
        long totalBookings,
        Map<String, Long> bookingsByStatus,
        BigDecimal estimatedRevenue,
        List<FieldStatsItem> fieldStats
) {}
