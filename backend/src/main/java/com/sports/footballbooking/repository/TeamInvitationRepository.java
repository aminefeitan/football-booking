package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.TeamInvitation;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class TeamInvitationRepository {

    @PersistenceContext
    private EntityManager em;

    public Optional<TeamInvitation> findById(UUID id) {
        if (id == null) return Optional.empty();
        try {
            TeamInvitation inv = em.createQuery(
                            "SELECT i FROM TeamInvitation i " +
                            "JOIN FETCH i.team " +
                            "JOIN FETCH i.invitedUser " +
                            "JOIN FETCH i.invitedBy " +
                            "WHERE i.id = :id", TeamInvitation.class)
                    .setParameter("id", id)
                    .getSingleResult();
            return Optional.of(inv);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public List<TeamInvitation> findByInvitedUser(UUID userId) {
        return em.createQuery(
                        "SELECT i FROM TeamInvitation i " +
                        "JOIN FETCH i.team " +
                        "JOIN FETCH i.invitedUser " +
                        "JOIN FETCH i.invitedBy " +
                        "WHERE i.invitedUser.id = :userId " +
                        "ORDER BY i.createdAt DESC", TeamInvitation.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    public boolean existsPending(UUID teamId, UUID invitedUserId) {
        Long count = em.createQuery(
                        "SELECT COUNT(i) FROM TeamInvitation i " +
                        "WHERE i.team.id = :teamId AND i.invitedUser.id = :invitedUserId " +
                        "AND i.status = :status", Long.class)
                .setParameter("teamId", teamId)
                .setParameter("invitedUserId", invitedUserId)
                .setParameter("status", TeamInvitation.InvitationStatus.PENDING)
                .getSingleResult();
        return count != null && count > 0;
    }

    public void persist(TeamInvitation invitation) {
        em.persist(invitation);
    }
}
