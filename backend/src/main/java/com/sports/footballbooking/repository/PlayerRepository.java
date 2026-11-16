package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.Player;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class PlayerRepository extends BaseRepository<Player> {

    public PlayerRepository() {
        super(Player.class);
    }

    public List<Player> search(String city, boolean onlyAvailable) {
        return search(city, null, onlyAvailable);
    }

    public List<Player> search(String city, String query, boolean onlyAvailable) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Player> cq = newQuery();
        Root<Player> root = cq.from(Player.class);

        List<Predicate> predicates = new ArrayList<>();
        if (onlyAvailable) {
            predicates.add(cb.isTrue(root.get("available")));
        }
        if (city != null && !city.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
        }
        if (query != null && !query.isBlank()) {
            String pattern = "%" + query.trim().toLowerCase() + "%";
            var fullName = cb.concat(cb.concat(cb.lower(root.get("firstName")), " "), cb.lower(root.get("lastName")));
            var reverseFullName = cb.concat(cb.concat(cb.lower(root.get("lastName")), " "), cb.lower(root.get("firstName")));
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(fullName, pattern),
                    cb.like(reverseFullName, pattern)
            ));
        }

        if (!predicates.isEmpty()) {
            cq.where(predicates.toArray(new Predicate[0]));
        }
        cq.orderBy(cb.asc(root.get("lastName")), cb.asc(root.get("firstName")));

        return em.createQuery(cq).getResultList();
    }
}

