package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.Field;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import java.math.BigDecimal;
import java.util.*;

@ApplicationScoped
public class FieldRepository {

    @PersistenceContext
    private EntityManager em;

    public Optional<Field> findById(UUID id) {
        if (id == null) return Optional.empty();
        try {
            Field f = em.createQuery(
                            "SELECT f FROM Field f " +
                            "JOIN FETCH f.owner " +
                            "LEFT JOIN FETCH f.reviewedBy " +
                            "WHERE f.id = :id", Field.class)
                    .setParameter("id", id)
                    .getSingleResult();
            return Optional.of(f);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public Optional<Field> findByIdForUpdate(UUID id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(em.find(Field.class, id, LockModeType.PESSIMISTIC_WRITE));
    }

    public List<Field> search(String city, String type, BigDecimal maxPrice, Boolean indoor, Boolean hasLights, Integer page, Integer size) {
        StringBuilder jpql = new StringBuilder(
                "SELECT f FROM Field f JOIN FETCH f.owner WHERE f.status = :approved");
        Map<String, Object> params = new HashMap<>();
        params.put("approved", Field.FieldStatus.APPROVED);

        if (city != null && !city.isBlank()) {
            jpql.append(" AND lower(f.city) = lower(:city)");
            params.put("city", city.trim());
        }
        if (type != null && !type.isBlank()) {
            jpql.append(" AND f.fieldType = :type");
            params.put("type", type.trim());
        }
        if (maxPrice != null) {
            jpql.append(" AND f.pricePerHour <= :maxPrice");
            params.put("maxPrice", maxPrice);
        }
        if (indoor != null) {
            jpql.append(" AND f.indoor = :indoor");
            params.put("indoor", indoor);
        }
        if (hasLights != null) {
            jpql.append(" AND f.hasLights = :hasLights");
            params.put("hasLights", hasLights);
        }

        jpql.append(" ORDER BY f.createdAt DESC");

        TypedQuery<Field> query = em.createQuery(jpql.toString(), Field.class);
        params.forEach(query::setParameter);

        if (page != null && size != null && size > 0) {
            int p = Math.max(0, page);
            int s = Math.min(100, Math.max(1, size));
            query.setFirstResult(p * s);
            query.setMaxResults(s);
        }

        return query.getResultList();
    }

    public List<Field> search(String city, String type, BigDecimal maxPrice, Boolean indoor, Boolean hasLights) {
        return search(city, type, maxPrice, indoor, hasLights, null, null);
    }

    public List<Field> findByOwner(UUID ownerId) {
        return em.createQuery(
                        "SELECT f FROM Field f JOIN FETCH f.owner " +
                        "WHERE f.owner.id = :ownerId ORDER BY f.createdAt DESC", Field.class)
                .setParameter("ownerId", ownerId)
                .getResultList();
    }

    public List<Field> findByStatus(Field.FieldStatus status) {
        return em.createQuery(
                        "SELECT f FROM Field f JOIN FETCH f.owner " +
                        "LEFT JOIN FETCH f.reviewedBy " +
                        "WHERE f.status = :status ORDER BY f.createdAt DESC", Field.class)
                .setParameter("status", status)
                .getResultList();
    }

    public void persist(Field field) {
        em.persist(field);
    }

    public Map<String, Long> countByStatus() {
        List<Object[]> rows = em.createQuery(
                "SELECT f.status, COUNT(f) FROM Field f GROUP BY f.status", Object[].class)
                .getResultList();
        Map<String, Long> result = new HashMap<>();
        for (Object[] r : rows) {
            result.put(r[0].toString(), (Long) r[1]);
        }
        return result;
    }
}
