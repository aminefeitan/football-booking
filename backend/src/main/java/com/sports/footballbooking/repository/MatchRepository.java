package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.Match;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class MatchRepository {

    @PersistenceContext
    private EntityManager em;

    public Optional<Match> findById(UUID id) {
        if (id == null)
            return Optional.empty();
        try {
            Match m = em.createQuery(
                    "SELECT m FROM Match m " +
                            "JOIN FETCH m.creator " +
                            "JOIN FETCH m.homeTeam " +
                            "JOIN FETCH m.awayTeam " +
                            "WHERE m.id = :id",
                    Match.class)
                    .setParameter("id", id)
                    .getSingleResult();
            return Optional.of(m);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public List<Match> findByUserId(UUID userId, Integer page, Integer size) {
        TypedQuery<Match> query = em.createQuery(
                "SELECT DISTINCT m FROM Match m " +
                        "JOIN FETCH m.creator " +
                        "JOIN FETCH m.homeTeam " +
                        "JOIN FETCH m.awayTeam " +
                        "WHERE m.creator.id = :userId " +
                        "OR m.homeTeam.id IN (SELECT tm.team.id FROM TeamMember tm WHERE tm.user.id = :userId) " +
                        "OR m.awayTeam.id IN (SELECT tm.team.id FROM TeamMember tm WHERE tm.user.id = :userId) " +
                        "ORDER BY m.startAt DESC",
                Match.class)
                .setParameter("userId", userId);

        if (page != null && size != null && size > 0) {
            int p = Math.max(0, page);
            int s = Math.min(100, Math.max(1, size));
            query.setFirstResult(p * s);
            query.setMaxResults(s);
        }

        return query.getResultList();
    }

    public List<Match> findByUserId(UUID userId) {
        return findByUserId(userId, null, null);
    }

    public void persist(Match match) {
        em.persist(match);
    }

    public long countAll() {
        Long count = em.createQuery("SELECT COUNT(m) FROM Match m", Long.class).getSingleResult();
        return count != null ? count : 0L;
    }
}
