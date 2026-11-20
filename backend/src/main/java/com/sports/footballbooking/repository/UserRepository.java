package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class UserRepository {

    @PersistenceContext
    private EntityManager em;

    public Optional<User> findById(UUID id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(em.find(User.class, id));
    }

    public Optional<User> findByEmail(String email) {
        if (email == null || email.isBlank()) return Optional.empty();
        try {
            User user = em.createQuery(
                            "SELECT u FROM User u WHERE lower(u.email) = lower(:email)", User.class)
                    .setParameter("email", email.trim())
                    .getSingleResult();
            return Optional.of(user);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public boolean existsByEmail(String email) {
        if (email == null || email.isBlank()) return false;
        Long count = em.createQuery(
                        "SELECT COUNT(u) FROM User u WHERE lower(u.email) = lower(:email)", Long.class)
                .setParameter("email", email.trim())
                .getSingleResult();
        return count != null && count > 0;
    }

    public List<User> findAll() {
        return em.createQuery("SELECT u FROM User u ORDER BY u.createdAt DESC", User.class)
                .getResultList();
    }

    public void persist(User user) {
        em.persist(user);
    }

    public Map<String, Long> countByRole() {
        List<Object[]> rows = em.createQuery(
                "SELECT u.role, COUNT(u) FROM User u GROUP BY u.role", Object[].class)
                .getResultList();
        Map<String, Long> result = new HashMap<>();
        for (Object[] r : rows) {
            result.put(r[0].toString(), (Long) r[1]);
        }
        return result;
    }

    public Map<String, Long> countByStatus() {
        List<Object[]> rows = em.createQuery(
                "SELECT u.status, COUNT(u) FROM User u GROUP BY u.status", Object[].class)
                .getResultList();
        Map<String, Long> result = new HashMap<>();
        for (Object[] r : rows) {
            result.put(r[0].toString(), (Long) r[1]);
        }
        return result;
    }
}
