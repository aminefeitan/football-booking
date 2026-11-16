package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Team;
import com.sports.footballbooking.entity.TeamInvitation;
import com.sports.footballbooking.entity.TeamMember;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.repository.TeamRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
@Transactional
public class TeamService {

    @Inject
    private TeamRepository teamRepository;

    @Inject
    private UserRepository userRepository;

    @Inject
    private com.sports.footballbooking.repository.PlayerRepository playerRepository;

    // ==================== DTOs compacts ====================

    public record CreateTeamRequest(
            @NotBlank String name,
            String description,
            String city,
            int maxMembers
    ) {
        public CreateTeamRequest(String name, String description, String city) {
            this(name, description, city, 15);
        }
    }

    public record AddMemberRequest(
            @NotNull UUID userId,
            String role,
            String position
    ) {}

    // ==================== Méthodes ====================

    public Team createTeam(UUID creatorId, CreateTeamRequest request) {
        User creator = userRepository.getById(creatorId);

        int max = request.maxMembers() > 0 ? request.maxMembers() : 15;
        Team team = new Team(creator, request.name(), request.city(), max);
        team.setDescription(request.description());
        team = teamRepository.save(team);
        teamRepository.flush();

        // Le créateur devient automatiquement capitaine
        TeamMember captain = new TeamMember(team, creator, "CAPTAIN", "Captain");
        teamRepository.persistMember(captain);

        return getTeamById(team.getId());
    }

    public Team getTeamById(UUID teamId) {
        Team team = teamRepository.getById(teamId);
        team.setMembers(teamRepository.findMembers(teamId));
        return team;
    }

    public List<Team> listTeams(String city) {
        List<Team> teams = teamRepository.findActive(city);
        teams.forEach(t -> t.setMembers(teamRepository.findMembers(t.getId())));
        return teams;
    }

    public TeamMember addMember(UUID teamId, AddMemberRequest request) {
        Team team = teamRepository.getById(teamId);
        User user = userRepository.getById(request.userId());

        if (teamRepository.isMember(teamId, user.getId())) {
            throw new BusinessException("L'utilisateur est déjà membre de cette équipe");
        }

        List<TeamMember> currentMembers = teamRepository.findMembers(teamId);
        if (currentMembers.size() >= team.getMaxMembers()) {
            throw new BusinessException("L'équipe a atteint la capacité maximale de " + team.getMaxMembers());
        }

        String role = request.role() != null ? request.role() : "MEMBER";
        TeamMember member = new TeamMember(team, user, role, request.position());
        teamRepository.persistMember(member);
        return member;
    }

    public void removeMember(UUID teamId, UUID userId) {
        teamRepository.removeMember(teamId, userId);
    }

    public List<Team> getUserTeams(UUID userId) {
        List<TeamMember> memberships = teamRepository.findUserMemberships(userId);
        return memberships.stream()
                .map(m -> getTeamById(m.getTeam().getId()))
                .toList();
    }

    // ==================== Invitations ====================

    public TeamInvitation invitePlayerByNameOrId(UUID teamId, UUID inviterId, UUID invitedUserId, String playerName, String playerEmail) {
        UUID targetId = invitedUserId;
        if (targetId == null && playerEmail != null && !playerEmail.isBlank()) {
            User u = userRepository.findByEmail(playerEmail.trim().toLowerCase())
                    .orElseThrow(() -> new BusinessException("Aucun utilisateur trouvé avec l'email : " + playerEmail));
            targetId = u.getId();
        } else if (targetId == null && playerName != null && !playerName.isBlank()) {
            List<com.sports.footballbooking.entity.Player> matches = playerRepository.search(null, playerName.trim(), false);
            if (matches.isEmpty()) {
                throw new BusinessException("Aucun joueur trouvé avec le nom : " + playerName);
            }
            targetId = matches.get(0).getId();
        }

        if (targetId == null) {
            throw new BusinessException("Veuillez renseigner un joueur valide à inviter");
        }

        return invitePlayer(teamId, inviterId, targetId);
    }

    public TeamInvitation invitePlayer(UUID teamId, UUID inviterId, UUID invitedUserId) {
        Team team = teamRepository.getById(teamId);
        User inviter = userRepository.getById(inviterId);
        User invited = userRepository.getById(invitedUserId);

        if (teamRepository.isMember(teamId, invitedUserId)) {
            throw new BusinessException("Ce joueur est déjà membre de l'équipe");
        }

        Optional<TeamInvitation> existing = teamRepository.findInvitation(teamId, invitedUserId);
        TeamInvitation invitation;
        if (existing.isPresent()) {
            invitation = existing.get();
            if ("PENDING".equals(invitation.getStatus())) {
                throw new BusinessException("Invitation déjà en attente pour ce joueur");
            }
            invitation.setStatus("PENDING");
            invitation = teamRepository.mergeInvitation(invitation);
        } else {
            invitation = new TeamInvitation(team, invited, inviter);
            teamRepository.persistInvitation(invitation);
        }
        return invitation;
    }

    public void acceptInvitation(UUID invitationId, UUID userId) {
        TeamInvitation invitation = teamRepository.findInvitationById(invitationId);
        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new BusinessException("Seul le joueur invité peut accepter cette invitation");
        }
        if (!"PENDING".equals(invitation.getStatus())) {
            throw new BusinessException("L'invitation n'est plus en attente");
        }

        invitation.accept();
        teamRepository.mergeInvitation(invitation);

        Team team = invitation.getTeam();
        List<TeamMember> currentMembers = teamRepository.findMembers(team.getId());
        if (currentMembers.size() < team.getMaxMembers()) {
            TeamMember member = new TeamMember(team, invitation.getInvitedUser(), "MEMBER", "Player");
            teamRepository.persistMember(member);
        }
    }

    public void declineInvitation(UUID invitationId, UUID userId) {
        TeamInvitation invitation = teamRepository.findInvitationById(invitationId);
        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new BusinessException("Seul le joueur invité peut refuser cette invitation");
        }
        invitation.decline();
        teamRepository.mergeInvitation(invitation);
    }

    public List<TeamInvitation> getPendingInvitations(UUID userId) {
        return teamRepository.findPendingInvitations(userId);
    }

    public List<TeamInvitation> getTeamInvitations(UUID teamId) {
        return teamRepository.findTeamInvitations(teamId);
    }
}
