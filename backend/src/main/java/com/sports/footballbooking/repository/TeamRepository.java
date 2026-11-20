package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.Team;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class TeamRepository {

    @PersistenceContext
    private EntityManager em;

    public Optional<Team> findById(UUID id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(em.find(Team.class, id));
    }

    public Optional<Team> findByIdForUpdate(UUID id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(em.find(Team.class, id, LockModeType.PESSIMISTIC_WRITE));
    }

    public List<Team> searchByName(String name) {
        String queryStr = (name != null && !name.isBlank())
                ? "SELECT t FROM Team t WHERE lower(t.name) LIKE lower(:name) ORDER BY t.name ASC"
                : "SELECT t FROM Team t ORDER BY t.name ASC";

        var query = em.createQuery(queryStr, Team.class).setMaxResults(20);
        if (name != null && !name.isBlank()) {
            query.setParameter("name", "%" + name.trim() + "%");
        }
        return query.getResultList();
    }

    public void persist(Team team) {
        em.persist(team);
    }

    public long countAll() {
        Long count = em.createQuery("SELECT COUNT(t) FROM Team t", Long.class).getSingleResult();
        return count != null ? count : 0L;
    }
}
