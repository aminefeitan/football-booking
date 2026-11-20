package com.sports.footballbooking.dto;

import com.sports.footballbooking.entity.Team;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record TeamResponse(
        UUID id,
        String name,
        String description,
        OffsetDateTime createdAt,
        List<TeamMemberResponse> members
) {
    public static TeamResponse from(Team team, List<TeamMemberResponse> members) {
        if (team == null) return null;
        return new TeamResponse(
                team.getId(),
                team.getName(),
                team.getDescription(),
                team.getCreatedAt(),
                members
        );
    }
}
