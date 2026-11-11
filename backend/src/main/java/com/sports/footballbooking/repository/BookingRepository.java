package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.Booking;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class BookingRepository extends BaseRepository<Booking> {

    public BookingRepository() {
        super(Booking.class);
    }

    public List<Booking> findOverlapping(UUID fieldId, OffsetDateTime startAt, OffsetDateTime endAt) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Booking> cq = newQuery();
        Root<Booking> root = cq.from(Booking.class);

        Predicate fieldMatch = cb.equal(root.get("field").get("id"), fieldId);
        Predicate statusMatch = root.get("status").in(Booking.Status.PENDING_PAYMENT, Booking.Status.CONFIRMED);
        Predicate timeOverlap = cb.and(
                cb.lessThan(root.get("startAt"), endAt),
                cb.greaterThan(root.get("endAt"), startAt)
        );

        cq.where(cb.and(fieldMatch, statusMatch, timeOverlap));
        return em.createQuery(cq).getResultList();
    }

    public List<Booking> findByUser(UUID userId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Booking> cq = newQuery();
        Root<Booking> root = cq.from(Booking.class);
        cq.where(cb.equal(root.get("user").get("id"), userId))
          .orderBy(cb.desc(root.get("startAt")));
        return em.createQuery(cq).getResultList();
    }

    public List<Booking> findByField(UUID fieldId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Booking> cq = newQuery();
        Root<Booking> root = cq.from(Booking.class);
        cq.where(
                cb.equal(root.get("field").get("id"), fieldId),
                root.get("status").in(Booking.Status.PENDING_PAYMENT, Booking.Status.CONFIRMED)
        ).orderBy(cb.asc(root.get("startAt")));
        return em.createQuery(cq).getResultList();
    }

    public List<Booking> findExpired(OffsetDateTime now) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Booking> cq = newQuery();
        Root<Booking> root = cq.from(Booking.class);
        cq.where(
                cb.equal(root.get("status"), Booking.Status.PENDING_PAYMENT),
                cb.isNotNull(root.get("expiresAt")),
                cb.lessThan(root.get("expiresAt"), now)
        );
        return em.createQuery(cq).getResultList();
    }
}

