package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.Team;
import com.sports.footballbooking.entity.TeamInvitation;
import com.sports.footballbooking.entity.TeamMember;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class TeamRepository extends BaseRepository<Team> {

    public TeamRepository() {
        super(Team.class);
    }

    public List<Team> findActive(String city) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Team> cq = newQuery();
        Root<Team> root = cq.from(Team.class);

        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isTrue(root.get("active")));

        if (city != null && !city.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
        }

        cq.where(predicates.toArray(new Predicate[0])).orderBy(cb.asc(root.get("name")));
        return em.createQuery(cq).getResultList();
    }

    // ==================== Membres ====================

    public List<TeamMember> findMembers(UUID teamId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<TeamMember> cq = cb.createQuery(TeamMember.class);
        Root<TeamMember> root = cq.from(TeamMember.class);
        cq.where(cb.equal(root.get("team").get("id"), teamId))
          .orderBy(cb.asc(root.get("joinedAt")));
        return em.createQuery(cq).getResultList();
    }

    public boolean isMember(UUID teamId, UUID userId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<TeamMember> root = cq.from(TeamMember.class);
        cq.select(cb.count(root)).where(
                cb.equal(root.get("team").get("id"), teamId),
                cb.equal(root.get("user").get("id"), userId)
        );
        return em.createQuery(cq).getSingleResult() > 0;
    }

    public void removeMember(UUID teamId, UUID userId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<TeamMember> cq = cb.createQuery(TeamMember.class);
        Root<TeamMember> root = cq.from(TeamMember.class);
        cq.where(
                cb.equal(root.get("team").get("id"), teamId),
                cb.equal(root.get("user").get("id"), userId)
        );
        List<TeamMember> result = em.createQuery(cq).getResultList();
        if (result.isEmpty()) {
            throw new NotFoundException("Membre de l'équipe introuvable pour l'utilisateur: " + userId);
        }
        em.remove(result.get(0));
    }

    public List<TeamMember> findUserMemberships(UUID userId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<TeamMember> cq = cb.createQuery(TeamMember.class);
        Root<TeamMember> root = cq.from(TeamMember.class);
        cq.where(cb.equal(root.get("user").get("id"), userId));
        return em.createQuery(cq).getResultList();
    }

    public void persistMember(TeamMember member) {
        em.persist(member);
    }

    // ==================== Invitations ====================

    public Optional<TeamInvitation> findInvitation(UUID teamId, UUID invitedUserId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<TeamInvitation> cq = cb.createQuery(TeamInvitation.class);
        Root<TeamInvitation> root = cq.from(TeamInvitation.class);
        cq.where(
                cb.equal(root.get("team").get("id"), teamId),
                cb.equal(root.get("invitedUser").get("id"), invitedUserId)
        );
        List<TeamInvitation> list = em.createQuery(cq).getResultList();
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<TeamInvitation> findPendingInvitations(UUID userId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<TeamInvitation> cq = cb.createQuery(TeamInvitation.class);
        Root<TeamInvitation> root = cq.from(TeamInvitation.class);
        cq.where(
                cb.equal(root.get("invitedUser").get("id"), userId),
                cb.equal(root.get("status"), "PENDING")
        ).orderBy(cb.desc(root.get("createdAt")));
        return em.createQuery(cq).getResultList();
    }

    public List<TeamInvitation> findTeamInvitations(UUID teamId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<TeamInvitation> cq = cb.createQuery(TeamInvitation.class);
        Root<TeamInvitation> root = cq.from(TeamInvitation.class);
        cq.where(cb.equal(root.get("team").get("id"), teamId))
          .orderBy(cb.desc(root.get("createdAt")));
        return em.createQuery(cq).getResultList();
    }

    public TeamInvitation findInvitationById(UUID invitationId) {
        TeamInvitation invitation = em.find(TeamInvitation.class, invitationId);
        if (invitation == null) throw new NotFoundException("TeamInvitation", invitationId);
        return invitation;
    }

    public void persistInvitation(TeamInvitation invitation) {
        em.persist(invitation);
    }

    public TeamInvitation mergeInvitation(TeamInvitation invitation) {
        return em.merge(invitation);
    }
}

