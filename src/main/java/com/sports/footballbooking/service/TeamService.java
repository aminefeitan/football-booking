package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Team;
import com.sports.footballbooking.entity.TeamInvitation;
import com.sports.footballbooking.entity.TeamMember;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@Transactional
public class TeamService {

    @PersistenceContext(unitName = "footballBookingPU")
    private EntityManager em;

    // ==================== Requêtes imbriquées ====================

    public static class CreateTeamRequest {
        @NotBlank public String name;
        public String description;
        public String city;
        public int maxMembers = 15;
    }

    public static class AddMemberRequest {
        @NotNull public UUID userId;
        public String role = "MEMBER";
        public String position;
    }

    // ==================== Méthodes ====================

    public Team createTeam(UUID creatorId, CreateTeamRequest request) {
        User creator = em.find(User.class, creatorId);
        if (creator == null) throw new NotFoundException("User", creatorId);

        Team team = new Team(creator, request.name, request.city, request.maxMembers);
        team.setDescription(request.description);
        em.persist(team);
        em.flush();

        // Le créateur devient automatiquement capitaine
        TeamMember captain = new TeamMember(team, creator, "CAPTAIN", "Captain");
        em.persist(captain);

        return getTeamById(team.getId());
    }

    public Team getTeamById(UUID teamId) {
        Team team = em.find(Team.class, teamId);
        if (team == null) throw new NotFoundException("Team", teamId);
        List<TeamMember> members = em.createNamedQuery("TeamMember.findByTeam", TeamMember.class)
                .setParameter("teamId", teamId)
                .getResultList();
        team.setMembers(members);
        return team;
    }

    public List<Team> listTeams(String city) {
        List<Team> teams;
        if (city != null && !city.isBlank()) {
            teams = em.createNamedQuery("Team.findByCity", Team.class)
                    .setParameter("city", city)
                    .getResultList();
        } else {
            teams = em.createNamedQuery("Team.findAllActive", Team.class).getResultList();
        }
        teams.forEach(t -> t.setMembers(
                em.createNamedQuery("TeamMember.findByTeam", TeamMember.class)
                        .setParameter("teamId", t.getId())
                        .getResultList()
        ));
        return teams;
    }

    public TeamMember addMember(UUID teamId, AddMemberRequest request) {
        Team team = em.find(Team.class, teamId);
        if (team == null) throw new NotFoundException("Team", teamId);

        User user = em.find(User.class, request.userId);
        if (user == null) throw new NotFoundException("User", request.userId);

        boolean alreadyMember = !em.createNamedQuery("TeamMember.findByTeamAndUser", TeamMember.class)
                .setParameter("teamId", teamId)
                .setParameter("userId", user.getId())
                .getResultList().isEmpty();
        if (alreadyMember) throw new BusinessException("L'utilisateur est déjà membre de cette équipe");

        List<TeamMember> currentMembers = em.createNamedQuery("TeamMember.findByTeam", TeamMember.class)
                .setParameter("teamId", teamId)
                .getResultList();
        if (currentMembers.size() >= team.getMaxMembers()) {
            throw new BusinessException("L'équipe a atteint la capacité maximale de " + team.getMaxMembers());
        }

        TeamMember member = new TeamMember(team, user, request.role, request.position);
        em.persist(member);
        return member;
    }

    public void removeMember(UUID teamId, UUID userId) {
        List<TeamMember> result = em.createNamedQuery("TeamMember.findByTeamAndUser", TeamMember.class)
                .setParameter("teamId", teamId)
                .setParameter("userId", userId)
                .getResultList();
        if (result.isEmpty()) throw new NotFoundException("Membre de l'équipe introuvable pour l'utilisateur: " + userId);
        em.remove(result.get(0));
    }

    public List<Team> getUserTeams(UUID userId) {
        List<TeamMember> memberships = em.createNamedQuery("TeamMember.findByUser", TeamMember.class)
                .setParameter("userId", userId)
                .getResultList();
        return memberships.stream()
                .map(m -> getTeamById(m.getTeam().getId()))
                .toList();
    }

    // ==================== Invitations ====================

    public TeamInvitation invitePlayer(UUID teamId, UUID inviterId, UUID invitedUserId) {
        Team team = em.find(Team.class, teamId);
        if (team == null) throw new NotFoundException("Team", teamId);

        User inviter = em.find(User.class, inviterId);
        if (inviter == null) throw new NotFoundException("User", inviterId);

        User invited = em.find(User.class, invitedUserId);
        if (invited == null) throw new NotFoundException("User", invitedUserId);

        boolean alreadyMember = !em.createNamedQuery("TeamMember.findByTeamAndUser", TeamMember.class)
                .setParameter("teamId", teamId)
                .setParameter("userId", invitedUserId)
                .getResultList().isEmpty();
        if (alreadyMember) throw new BusinessException("Ce joueur est déjà membre de l'équipe");

        List<TeamInvitation> existing = em.createNamedQuery("TeamInvitation.findByTeamAndUser", TeamInvitation.class)
                .setParameter("teamId", teamId)
                .setParameter("userId", invitedUserId)
                .getResultList();

        TeamInvitation invitation;
        if (!existing.isEmpty()) {
            invitation = existing.get(0);
            if ("PENDING".equals(invitation.getStatus())) throw new BusinessException("Invitation déjà en attente pour ce joueur");
            invitation.setStatus("PENDING");
            invitation = em.merge(invitation);
        } else {
            invitation = new TeamInvitation(team, invited, inviter);
            em.persist(invitation);
        }
        return invitation;
    }

    public void acceptInvitation(UUID invitationId, UUID userId) {
        TeamInvitation invitation = em.find(TeamInvitation.class, invitationId);
        if (invitation == null) throw new NotFoundException("TeamInvitation", invitationId);
        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new BusinessException("Seul le joueur invité peut accepter cette invitation");
        }
        if (!"PENDING".equals(invitation.getStatus())) throw new BusinessException("L'invitation n'est plus en attente");

        invitation.accept();
        em.merge(invitation);

        Team team = invitation.getTeam();
        List<TeamMember> currentMembers = em.createNamedQuery("TeamMember.findByTeam", TeamMember.class)
                .setParameter("teamId", team.getId())
                .getResultList();
        if (currentMembers.size() < team.getMaxMembers()) {
            TeamMember member = new TeamMember(team, invitation.getInvitedUser(), "MEMBER", "Player");
            em.persist(member);
        }
    }

    public void declineInvitation(UUID invitationId, UUID userId) {
        TeamInvitation invitation = em.find(TeamInvitation.class, invitationId);
        if (invitation == null) throw new NotFoundException("TeamInvitation", invitationId);
        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new BusinessException("Seul le joueur invité peut refuser cette invitation");
        }
        invitation.decline();
        em.merge(invitation);
    }

    public List<TeamInvitation> getPendingInvitations(UUID userId) {
        return em.createNamedQuery("TeamInvitation.findByInvitedUser", TeamInvitation.class)
                .setParameter("userId", userId)
                .setParameter("status", "PENDING")
                .getResultList();
    }

    public List<TeamInvitation> getTeamInvitations(UUID teamId) {
        return em.createNamedQuery("TeamInvitation.findByTeam", TeamInvitation.class)
                .setParameter("teamId", teamId)
                .getResultList();
    }
}
