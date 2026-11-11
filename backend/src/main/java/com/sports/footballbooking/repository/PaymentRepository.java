package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.Payment;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class PaymentRepository extends BaseRepository<Payment> {

    public PaymentRepository() {
        super(Payment.class);
    }

    public List<Payment> findByUser(UUID userId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Payment> cq = newQuery();
        Root<Payment> root = cq.from(Payment.class);
        cq.where(cb.equal(root.get("user").get("id"), userId))
          .orderBy(cb.desc(root.get("createdAt")));
        return em.createQuery(cq).getResultList();
    }

    public Optional<Payment> findByBooking(UUID bookingId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Payment> cq = newQuery();
        Root<Payment> root = cq.from(Payment.class);
        cq.where(cb.equal(root.get("booking").get("id"), bookingId));
        List<Payment> list = em.createQuery(cq).setMaxResults(1).getResultList();
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}

