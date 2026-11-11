package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class UserRepository extends BaseRepository<User> {

    public UserRepository() {
        super(User.class);
    }

    public Optional<User> findByEmail(String email) {
        return findOneBy("email", email);
    }

    public boolean existsByEmail(String email) {
        return existsBy("email", email);
    }

    public List<User> findByRole(User.Role role) {
        User.Role filter = role != null ? role : User.Role.PLAYER;
        CriteriaBuilder cb = cb();
        CriteriaQuery<User> cq = newQuery();
        Root<User> root = cq.from(User.class);
        cq.where(cb.equal(root.get("role"), filter))
          .orderBy(cb.asc(root.get("lastName")));
        return em.createQuery(cq).getResultList();
    }
}

