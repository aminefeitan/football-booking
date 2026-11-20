package com.sports.footballbooking.service;

import com.sports.footballbooking.dto.AdminStatsResponse;
import com.sports.footballbooking.dto.FieldStatsItem;
import com.sports.footballbooking.dto.ManagerStatsResponse;
import com.sports.footballbooking.repository.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class StatsService {

    @Inject
    private BookingRepository bookingRepository;

    @Inject
    private UserRepository userRepository;

    @Inject
    private FieldRepository fieldRepository;

    @Inject
    private TeamRepository teamRepository;

    @Inject
    private MatchRepository matchRepository;

    public ManagerStatsResponse getManagerStats(UUID managerId, OffsetDateTime from, OffsetDateTime to) {
        Map<String, Long> bookingsByStatus = bookingRepository.countByStatusForManager(managerId, from, to);
        long totalBookings = bookingsByStatus.values().stream().mapToLong(Long::longValue).sum();

        BigDecimal estimatedRevenue = bookingRepository.sumRevenueForManager(managerId, from, to);
        List<FieldStatsItem> fieldStats = bookingRepository.findFieldStatsForManager(managerId, from, to);

        return new ManagerStatsResponse(
                totalBookings,
                bookingsByStatus,
                estimatedRevenue,
                fieldStats
        );
    }

    public AdminStatsResponse getAdminStats() {
        Map<String, Long> usersByRole = userRepository.countByRole();
        Map<String, Long> usersByStatus = userRepository.countByStatus();
        Map<String, Long> fieldsByStatus = fieldRepository.countByStatus();
        Map<String, Long> bookingsByStatus = bookingRepository.countByStatusAdmin();
        BigDecimal totalRevenue = bookingRepository.sumRevenueAdmin();
        long totalTeams = teamRepository.countAll();
        long totalMatches = matchRepository.countAll();

        return new AdminStatsResponse(
                usersByRole,
                usersByStatus,
                fieldsByStatus,
                bookingsByStatus,
                totalRevenue,
                totalTeams,
                totalMatches
        );
    }
}
