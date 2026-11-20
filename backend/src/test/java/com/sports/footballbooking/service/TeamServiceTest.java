package com.sports.footballbooking.service;

import com.sports.footballbooking.dto.InviteMemberRequest;
import com.sports.footballbooking.dto.TeamInvitationResponse;
import com.sports.footballbooking.entity.Team;
import com.sports.footballbooking.entity.TeamInvitation;
import com.sports.footballbooking.entity.TeamMember;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.TeamInvitationRepository;
import com.sports.footballbooking.repository.TeamMemberRepository;
import com.sports.footballbooking.repository.TeamRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private TeamInvitationRepository teamInvitationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TeamService teamService;

    private User captain;
    private User nonCaptain;
    private User invitedPlayer;
    private Team team;
    private UUID teamId;
    private UUID captainId;
    private UUID nonCaptainId;
    private UUID invitedPlayerId;

    @BeforeEach
    void setUp() throws Exception {
        teamId = UUID.randomUUID();
        captainId = UUID.randomUUID();
        nonCaptainId = UUID.randomUUID();
        invitedPlayerId = UUID.randomUUID();

        captain = new User("captain@example.com", "hash", "Capitaine", "Hakimi", null, User.Role.PLAYER);
        setId(captain, captainId);

        nonCaptain = new User("member@example.com", "hash", "Membre", "Ziyech", null, User.Role.PLAYER);
        setId(nonCaptain, nonCaptainId);

        invitedPlayer = new User("invited@example.com", "hash", "Invite", "Diaz", null, User.Role.PLAYER);
        setId(invitedPlayer, invitedPlayerId);

        team = new Team("Atlas Lions", "Equipe nationale");
        setId(team, teamId);
    }

    private void setId(Object entity, UUID id) throws Exception {
        Field idField = entity.getClass().getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }

    @Test
    @DisplayName("5. Non-capitaine qui invite -> 403 Forbidden")
    void testNonCaptainCannotInvite() {
        InviteMemberRequest req = new InviteMemberRequest("invited@example.com");
        when(teamMemberRepository.isCaptain(teamId, nonCaptainId)).thenReturn(false);

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                teamService.inviteMember(teamId, nonCaptainId, req));
        assertTrue(ex.getMessage().contains("Seul le capitaine"));
        verify(teamInvitationRepository, never()).persist(any(TeamInvitation.class));
    }

    @Test
    @DisplayName("5. Capitaine invite avec succès")
    void testCaptainCanInvite() {
        InviteMemberRequest req = new InviteMemberRequest("invited@example.com");

        when(teamMemberRepository.isCaptain(teamId, captainId)).thenReturn(true);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.countMembers(teamId)).thenReturn(5L);
        when(userRepository.findByEmail("invited@example.com")).thenReturn(Optional.of(invitedPlayer));
        when(teamMemberRepository.isMember(teamId, invitedPlayerId)).thenReturn(false);
        when(teamInvitationRepository.existsPending(teamId, invitedPlayerId)).thenReturn(false);
        when(userRepository.findById(captainId)).thenReturn(Optional.of(captain));

        TeamInvitationResponse res = teamService.inviteMember(teamId, captainId, req);

        assertNotNull(res);
        assertEquals(TeamInvitation.InvitationStatus.PENDING, res.status());
        verify(teamInvitationRepository, times(1)).persist(any(TeamInvitation.class));
    }

    @Test
    @DisplayName("5. Accepter invitation crée un membre ; second acceptation -> 409 Conflict")
    void testAcceptInvitationAndSecondAcceptConflict() throws Exception {
        UUID invitationId = UUID.randomUUID();
        TeamInvitation invitation = new TeamInvitation(team, invitedPlayer, captain);
        setId(invitation, invitationId);

        when(teamInvitationRepository.findById(invitationId)).thenReturn(Optional.of(invitation));
        when(teamRepository.findByIdForUpdate(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.countMembers(teamId)).thenReturn(5L);
        when(teamMemberRepository.isMember(teamId, invitedPlayerId)).thenReturn(false);
        when(userRepository.findById(invitedPlayerId)).thenReturn(Optional.of(invitedPlayer));

        // First accept
        teamService.acceptInvitation(invitationId, invitedPlayerId);

        assertEquals(TeamInvitation.InvitationStatus.ACCEPTED, invitation.getStatus());
        verify(teamMemberRepository, times(1)).persist(any(TeamMember.class));

        // Second accept -> invitation is no longer PENDING -> 409 Conflict
        ClientErrorException ex = assertThrows(ClientErrorException.class, () ->
                teamService.acceptInvitation(invitationId, invitedPlayerId));
        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
        assertTrue(ex.getMessage().contains("plus en attente"));
    }
}
