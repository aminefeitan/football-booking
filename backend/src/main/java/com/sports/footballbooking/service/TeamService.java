package com.sports.footballbooking.service;

import com.sports.footballbooking.dto.*;
import com.sports.footballbooking.entity.Team;
import com.sports.footballbooking.entity.TeamInvitation;
import com.sports.footballbooking.entity.TeamMember;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.TeamInvitationRepository;
import com.sports.footballbooking.repository.TeamMemberRepository;
import com.sports.footballbooking.repository.TeamRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class TeamService {

    public static final int MAX_MEMBERS = 15;

    @Inject
    private TeamRepository teamRepository;

    @Inject
    private TeamMemberRepository teamMemberRepository;

    @Inject
    private TeamInvitationRepository teamInvitationRepository;

    @Inject
    private UserRepository userRepository;

    @Transactional
    public TeamResponse createTeam(UUID creatorId, CreateTeamRequest req) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new NotFoundException("Joueur introuvable"));

        if (creator.getRole() != User.Role.PLAYER) {
            throw new ForbiddenException("Seuls les joueurs peuvent créer une équipe");
        }

        Team team = new Team(req.name().trim(), req.description() != null ? req.description().trim() : null);
        teamRepository.persist(team);

        TeamMember captain = new TeamMember(team, creator, TeamMember.TeamRole.CAPTAIN);
        teamMemberRepository.persist(captain);

        List<TeamMemberResponse> members = List.of(TeamMemberResponse.from(captain));
        return TeamResponse.from(team, members);
    }

    public List<TeamResponse> getMyTeams(UUID userId) {
        List<TeamMember> memberships = teamMemberRepository.findByUser(userId);
        return memberships.stream()
                .map(m -> {
                    Team team = m.getTeam();
                    List<TeamMemberResponse> members = teamMemberRepository.findByTeam(team.getId()).stream()
                            .map(TeamMemberResponse::from)
                            .toList();
                    return TeamResponse.from(team, members);
                })
                .toList();
    }

    public TeamResponse getTeamDetails(UUID teamId, UUID userId) {
        if (!teamMemberRepository.isMember(teamId, userId)) {
            // Lecture interdite si non membre -> 404 comme stipulé
            throw new NotFoundException("Équipe introuvable");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("Équipe introuvable"));

        List<TeamMemberResponse> members = teamMemberRepository.findByTeam(teamId).stream()
                .map(TeamMemberResponse::from)
                .toList();

        return TeamResponse.from(team, members);
    }

    public List<TeamSummaryResponse> searchTeams(String name) {
        return teamRepository.searchByName(name).stream()
                .map(t -> new TeamSummaryResponse(t.getId(), t.getName()))
                .toList();
    }

    @Transactional
    public TeamInvitationResponse inviteMember(UUID teamId, UUID captainId, InviteMemberRequest req) {
        if (!teamMemberRepository.isCaptain(teamId, captainId)) {
            throw new ForbiddenException("Seul le capitaine de l'équipe peut inviter des membres");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("Équipe introuvable"));

        long currentCount = teamMemberRepository.countMembers(teamId);
        if (currentCount >= MAX_MEMBERS) {
            throw new ClientErrorException("L'équipe a atteint la limite de " + MAX_MEMBERS + " membres", Response.Status.CONFLICT);
        }

        String email = req.email().trim().toLowerCase();
        User invited = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        if (invited.getRole() != User.Role.PLAYER || invited.getStatus() != User.Status.ACTIVE) {
            throw new NotFoundException("Utilisateur introuvable ou non éligible");
        }

        if (teamMemberRepository.isMember(teamId, invited.getId())) {
            throw new ClientErrorException("Ce joueur est déjà membre de l'équipe", Response.Status.CONFLICT);
        }

        if (teamInvitationRepository.existsPending(teamId, invited.getId())) {
            throw new ClientErrorException("Une invitation en attente existe déjà pour ce joueur", Response.Status.CONFLICT);
        }

        User captain = userRepository.findById(captainId)
                .orElseThrow(() -> new NotFoundException("Capitaine introuvable"));

        TeamInvitation invitation = new TeamInvitation(team, invited, captain);
        teamInvitationRepository.persist(invitation);

        return TeamInvitationResponse.from(invitation);
    }

    @Transactional
    public void removeMember(UUID teamId, UUID captainId, UUID targetUserId) {
        if (!teamMemberRepository.isCaptain(teamId, captainId)) {
            throw new ForbiddenException("Seul le capitaine peut exclure un membre");
        }

        if (captainId.equals(targetUserId)) {
            throw new BadRequestException("Le capitaine ne peut pas s'exclure lui-même");
        }

        TeamMember member = teamMemberRepository.findByTeamAndUser(teamId, targetUserId)
                .orElseThrow(() -> new NotFoundException("Membre introuvable dans cette équipe"));

        teamMemberRepository.remove(member);
    }

    public List<TeamInvitationResponse> getMyInvitations(UUID userId) {
        return teamInvitationRepository.findByInvitedUser(userId).stream()
                .filter(i -> i.getStatus() == TeamInvitation.InvitationStatus.PENDING)
                .map(TeamInvitationResponse::from)
                .toList();
    }

    @Transactional
    public void acceptInvitation(UUID invitationId, UUID userId) {
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new NotFoundException("Invitation introuvable"));

        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new ForbiddenException("Cette invitation ne vous est pas destinée");
        }

        if (invitation.getStatus() != TeamInvitation.InvitationStatus.PENDING) {
            throw new ClientErrorException("Cette invitation n'est plus en attente", Response.Status.CONFLICT);
        }

        // Lock team to ensure MAX_MEMBERS check is safe under concurrency
        Team team = teamRepository.findByIdForUpdate(invitation.getTeam().getId())
                .orElseThrow(() -> new NotFoundException("Équipe introuvable"));

        long memberCount = teamMemberRepository.countMembers(team.getId());
        if (memberCount >= MAX_MEMBERS) {
            throw new ClientErrorException("L'équipe a atteint la limite de " + MAX_MEMBERS + " membres", Response.Status.CONFLICT);
        }

        if (teamMemberRepository.isMember(team.getId(), userId)) {
            invitation.setStatus(TeamInvitation.InvitationStatus.ACCEPTED);
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        TeamMember member = new TeamMember(team, user, TeamMember.TeamRole.MEMBER);
        teamMemberRepository.persist(member);

        invitation.setStatus(TeamInvitation.InvitationStatus.ACCEPTED);
    }

    @Transactional
    public void declineInvitation(UUID invitationId, UUID userId) {
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new NotFoundException("Invitation introuvable"));

        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new ForbiddenException("Cette invitation ne vous est pas destinée");
        }

        if (invitation.getStatus() != TeamInvitation.InvitationStatus.PENDING) {
            throw new ClientErrorException("Cette invitation n'est plus en attente", Response.Status.CONFLICT);
        }

        invitation.setStatus(TeamInvitation.InvitationStatus.DECLINED);
    }
}
