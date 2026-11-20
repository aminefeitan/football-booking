package com.sports.footballbooking.dto;

import com.sports.footballbooking.entity.TeamInvitation;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TeamInvitationResponse(
        UUID id,
        UUID teamId,
        String teamName,
        UUID invitedUserId,
        String invitedUserEmail,
        UUID invitedById,
        String invitedByName,
        TeamInvitation.InvitationStatus status,
        OffsetDateTime createdAt
) {
    public static TeamInvitationResponse from(TeamInvitation inv) {
        if (inv == null) return null;
        String invitedByName = inv.getInvitedBy() != null
                ? inv.getInvitedBy().getFirstName() + " " + inv.getInvitedBy().getLastName()
                : null;
        return new TeamInvitationResponse(
                inv.getId(),
                inv.getTeam().getId(),
                inv.getTeam().getName(),
                inv.getInvitedUser().getId(),
                inv.getInvitedUser().getEmail(),
                inv.getInvitedBy().getId(),
                invitedByName,
                inv.getStatus(),
                inv.getCreatedAt()
        );
    }
}
