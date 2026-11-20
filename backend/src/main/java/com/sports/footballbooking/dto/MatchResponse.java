package com.sports.footballbooking.dto;

import com.sports.footballbooking.entity.Match;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MatchResponse(
        UUID id,
        UUID creatorId,
        String creatorName,
        UUID homeTeamId,
        String homeTeamName,
        UUID awayTeamId,
        String awayTeamName,
        OffsetDateTime startAt,
        int durationMinutes,
        Match.MatchStatus status,
        OffsetDateTime createdAt
) {
    public static MatchResponse from(Match match) {
        if (match == null) return null;
        Match.MatchStatus effectiveStatus = match.getStatus();
        if (effectiveStatus == Match.MatchStatus.PLANNED && match.getStartAt() != null) {
            OffsetDateTime endAt = match.getStartAt().plusMinutes(match.getDurationMinutes());
            if (endAt.isBefore(OffsetDateTime.now())) {
                effectiveStatus = Match.MatchStatus.FINISHED;
            }
        }

        String creatorName = match.getCreator() != null
                ? match.getCreator().getFirstName() + " " + match.getCreator().getLastName()
                : null;
        String homeTeamName = match.getHomeTeam() != null ? match.getHomeTeam().getName() : null;
        String awayTeamName = match.getAwayTeam() != null ? match.getAwayTeam().getName() : null;

        return new MatchResponse(
                match.getId(),
                match.getCreator() != null ? match.getCreator().getId() : null,
                creatorName,
                match.getHomeTeam() != null ? match.getHomeTeam().getId() : null,
                homeTeamName,
                match.getAwayTeam() != null ? match.getAwayTeam().getId() : null,
                awayTeamName,
                match.getStartAt(),
                match.getDurationMinutes(),
                effectiveStatus,
                match.getCreatedAt()
        );
    }
}
