package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.TeamMember;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class TeamMemberRepository {

    @PersistenceContext
    private EntityManager em;

    public Optional<TeamMember> findByTeamAndUser(UUID teamId, UUID userId) {
        if (teamId == null || userId == null) return Optional.empty();
        try {
            TeamMember tm = em.createQuery(
                            "SELECT tm FROM TeamMember tm " +
                            "JOIN FETCH tm.team " +
                            "JOIN FETCH tm.user " +
                            "WHERE tm.team.id = :teamId AND tm.user.id = :userId", TeamMember.class)
                    .setParameter("teamId", teamId)
                    .setParameter("userId", userId)
                    .getSingleResult();
            return Optional.of(tm);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public List<TeamMember> findByTeam(UUID teamId) {
        return em.createQuery(
                        "SELECT tm FROM TeamMember tm " +
                        "JOIN FETCH tm.user " +
                        "WHERE tm.team.id = :teamId " +
                        "ORDER BY tm.joinedAt ASC", TeamMember.class)
                .setParameter("teamId", teamId)
                .getResultList();
    }

    public List<TeamMember> findByUser(UUID userId) {
        return em.createQuery(
                        "SELECT tm FROM TeamMember tm " +
                        "JOIN FETCH tm.team " +
                        "WHERE tm.user.id = :userId " +
                        "ORDER BY tm.joinedAt DESC", TeamMember.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    public boolean isCaptain(UUID teamId, UUID userId) {
        if (teamId == null || userId == null) return false;
        Long count = em.createQuery(
                        "SELECT COUNT(tm) FROM TeamMember tm " +
                        "WHERE tm.team.id = :teamId AND tm.user.id = :userId AND tm.role = :role", Long.class)
                .setParameter("teamId", teamId)
                .setParameter("userId", userId)
                .setParameter("role", TeamMember.TeamRole.CAPTAIN)
                .getSingleResult();
        return count != null && count > 0;
    }

    public boolean isMember(UUID teamId, UUID userId) {
        if (teamId == null || userId == null) return false;
        Long count = em.createQuery(
                        "SELECT COUNT(tm) FROM TeamMember tm " +
                        "WHERE tm.team.id = :teamId AND tm.user.id = :userId", Long.class)
                .setParameter("teamId", teamId)
                .setParameter("userId", userId)
                .getSingleResult();
        return count != null && count > 0;
    }

    public long countMembers(UUID teamId) {
        Long count = em.createQuery(
                        "SELECT COUNT(tm) FROM TeamMember tm WHERE tm.team.id = :teamId", Long.class)
                .setParameter("teamId", teamId)
                .getSingleResult();
        return count != null ? count : 0L;
    }

    public void persist(TeamMember member) {
        em.persist(member);
    }

    public void remove(TeamMember member) {
        em.remove(member);
    }
}
