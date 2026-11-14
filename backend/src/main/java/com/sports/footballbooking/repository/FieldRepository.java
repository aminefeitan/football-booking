package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.Field;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class FieldRepository extends BaseRepository<Field> {

    public FieldRepository() {
        super(Field.class);
    }

    public List<Field> findAllActive() {
        return findListBy("active", true);
    }

    public List<Field> searchFields(String city, String fieldType, Double maxPrice, Boolean indoor, Boolean hasLights) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Field> cq = newQuery();
        Root<Field> root = cq.from(Field.class);

        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isTrue(root.get("active")));

        if (city != null && !city.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
        }
        if (fieldType != null && !fieldType.isBlank()) {
            predicates.add(cb.equal(root.get("fieldType"), fieldType.trim()));
        }
        if (maxPrice != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("pricePerHour"), BigDecimal.valueOf(maxPrice)));
        }
        if (indoor != null) {
            predicates.add(cb.equal(root.get("indoor"), indoor));
        }
        if (hasLights != null) {
            predicates.add(cb.equal(root.get("hasLights"), hasLights));
        }

        cq.where(predicates.toArray(new Predicate[0]))
          .orderBy(cb.asc(root.get("name")));

        return em.createQuery(cq).getResultList();
    }

    public List<Field> findByOwner(UUID ownerId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Field> cq = newQuery();
        Root<Field> root = cq.from(Field.class);
        // Retourne TOUS les terrains du gérant (actifs et inactifs)
        cq.where(cb.equal(root.get("owner").get("id"), ownerId))
          .orderBy(cb.desc(root.get("createdAt")));
        return em.createQuery(cq).getResultList();
    }
}

