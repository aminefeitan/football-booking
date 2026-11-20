package com.sports.footballbooking.dto;

import java.math.BigDecimal;
import java.util.Map;

public record AdminStatsResponse(
        Map<String, Long> usersByRole,
        Map<String, Long> usersByStatus,
        Map<String, Long> fieldsByStatus,
        Map<String, Long> bookingsByStatus,
        BigDecimal totalRevenue,
        long totalTeams,
        long totalMatches
) {}
