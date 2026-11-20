package com.sports.footballbooking.dto;

import com.sports.footballbooking.entity.TeamMember;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TeamMemberResponse(
        UUID userId,
        String firstName,
        String lastName,
        String email,
        String phone,
        TeamMember.TeamRole role,
        OffsetDateTime joinedAt
) {
    public static TeamMemberResponse from(TeamMember tm) {
        if (tm == null) return null;
        return new TeamMemberResponse(
                tm.getUser().getId(),
                tm.getUser().getFirstName(),
                tm.getUser().getLastName(),
                tm.getUser().getEmail(),
                tm.getUser().getPhone(),
                tm.getRole(),
                tm.getJoinedAt()
        );
    }
}
