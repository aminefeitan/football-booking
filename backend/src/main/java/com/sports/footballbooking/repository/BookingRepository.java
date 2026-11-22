package com.sports.footballbooking.repository;

import com.sports.footballbooking.dto.FieldStatsItem;
import com.sports.footballbooking.entity.Booking;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@ApplicationScoped
public class BookingRepository {

    @PersistenceContext
    private EntityManager em;

    public Optional<Booking> findById(UUID id) {
        if (id == null) return Optional.empty();
        try {
            Booking b = em.createQuery(
                            "SELECT b FROM Booking b " +
                            "JOIN FETCH b.match m " +
                            "JOIN FETCH m.homeTeam " +
                            "JOIN FETCH m.awayTeam " +
                            "JOIN FETCH b.user " +
                            "JOIN FETCH b.field f " +
                            "JOIN FETCH f.owner " +
                            "LEFT JOIN FETCH b.handledBy " +
                            "WHERE b.id = :id", Booking.class)
                    .setParameter("id", id)
                    .getSingleResult();
            return Optional.of(b);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public List<Booking> findByUser(UUID userId) {
        return em.createQuery(
                        "SELECT b FROM Booking b " +
                        "JOIN FETCH b.match m " +
                        "JOIN FETCH m.homeTeam " +
                        "JOIN FETCH m.awayTeam " +
                        "JOIN FETCH b.user " +
                        "JOIN FETCH b.field f " +
                        "WHERE b.user.id = :userId " +
                        "ORDER BY b.startAt DESC", Booking.class)
                .setParameter("userId", userId)
                .setMaxResults(200)
                .getResultList();
    }

    public List<Booking> findByManager(UUID managerId, Booking.BookingStatus status) {
        String jpql = "SELECT b FROM Booking b " +
                "JOIN FETCH b.match m " +
                "JOIN FETCH m.homeTeam " +
                "JOIN FETCH m.awayTeam " +
                "JOIN FETCH b.user " +
                "JOIN FETCH b.field f " +
                "WHERE f.owner.id = :managerId " +
                (status != null ? "AND b.status = :status " : "") +
                "ORDER BY b.startAt DESC";

        TypedQuery<Booking> query = em.createQuery(jpql, Booking.class)
                .setParameter("managerId", managerId);
        if (status != null) {
            query.setParameter("status", status);
        }
        return query.getResultList();
    }

    public Optional<Booking> findActiveByMatch(UUID matchId) {
        List<Booking> list = em.createQuery(
                        "SELECT b FROM Booking b " +
                        "WHERE b.match.id = :matchId AND b.status IN (:stPending, :stConfirmed)", Booking.class)
                .setParameter("matchId", matchId)
                .setParameter("stPending", Booking.BookingStatus.PENDING)
                .setParameter("stConfirmed", Booking.BookingStatus.CONFIRMED)
                .setMaxResults(1)
                .getResultList();
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public long countPendingByUser(UUID userId) {
        Long count = em.createQuery(
                        "SELECT COUNT(b) FROM Booking b " +
                        "WHERE b.user.id = :userId AND b.status = :status", Long.class)
                .setParameter("userId", userId)
                .setParameter("status", Booking.BookingStatus.PENDING)
                .getSingleResult();
        return count != null ? count : 0L;
    }

    public boolean existsOverlapping(UUID fieldId, OffsetDateTime startAt, OffsetDateTime endAt) {
        Long count = em.createQuery(
                        "SELECT COUNT(b) FROM Booking b " +
                        "WHERE b.field.id = :fieldId " +
                        "AND b.status IN (:stPending, :stConfirmed) " +
                        "AND b.startAt < :endAt AND b.endAt > :startAt", Long.class)
                .setParameter("fieldId", fieldId)
                .setParameter("stPending", Booking.BookingStatus.PENDING)
                .setParameter("stConfirmed", Booking.BookingStatus.CONFIRMED)
                .setParameter("startAt", startAt)
                .setParameter("endAt", endAt)
                .getSingleResult();
        return count != null && count > 0;
    }

    public List<Booking> findActiveBetween(UUID fieldId, OffsetDateTime start, OffsetDateTime end) {
        return em.createQuery(
                        "SELECT b FROM Booking b " +
                        "WHERE b.field.id = :fieldId " +
                        "AND b.status IN (:stPending, :stConfirmed) " +
                        "AND b.startAt < :end AND b.endAt > :start " +
                        "ORDER BY b.startAt ASC", Booking.class)
                .setParameter("fieldId", fieldId)
                .setParameter("stPending", Booking.BookingStatus.PENDING)
                .setParameter("stConfirmed", Booking.BookingStatus.CONFIRMED)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
    }

    public void persist(Booking booking) {
        em.persist(booking);
    }

    public void flush() {
        em.flush();
    }

    // --- Statistiques agrégées JPQL ---

    public Map<String, Long> countByStatusForManager(UUID managerId, OffsetDateTime from, OffsetDateTime to) {
        StringBuilder jpql = new StringBuilder(
                "SELECT b.status, COUNT(b) FROM Booking b WHERE b.field.owner.id = :managerId");
        if (from != null) jpql.append(" AND b.startAt >= :from");
        if (to != null) jpql.append(" AND b.startAt <= :to");
        jpql.append(" GROUP BY b.status");

        TypedQuery<Object[]> q = em.createQuery(jpql.toString(), Object[].class)
                .setParameter("managerId", managerId);
        if (from != null) q.setParameter("from", from);
        if (to != null) q.setParameter("to", to);

        Map<String, Long> res = new HashMap<>();
        for (Object[] row : q.getResultList()) {
            res.put(row[0].toString(), (Long) row[1]);
        }
        return res;
    }

    public BigDecimal sumRevenueForManager(UUID managerId, OffsetDateTime from, OffsetDateTime to) {
        StringBuilder jpql = new StringBuilder(
                "SELECT SUM(b.totalAmount) FROM Booking b " +
                "WHERE b.field.owner.id = :managerId AND b.status = :status");
        if (from != null) jpql.append(" AND b.startAt >= :from");
        if (to != null) jpql.append(" AND b.startAt <= :to");

        TypedQuery<BigDecimal> q = em.createQuery(jpql.toString(), BigDecimal.class)
                .setParameter("managerId", managerId)
                .setParameter("status", Booking.BookingStatus.CONFIRMED);
        if (from != null) q.setParameter("from", from);
        if (to != null) q.setParameter("to", to);

        BigDecimal sum = q.getSingleResult();
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public List<FieldStatsItem> findFieldStatsForManager(UUID managerId, OffsetDateTime from, OffsetDateTime to) {
        StringBuilder jpql = new StringBuilder(
                "SELECT f.id, f.name, " +
                "COUNT(CASE WHEN b.status = :confirmed THEN 1 END), " +
                "COALESCE(SUM(CASE WHEN b.status = :confirmed THEN b.totalAmount ELSE 0 END), 0) " +
                "FROM Field f LEFT JOIN Booking b ON b.field.id = f.id ");
        if (from != null || to != null) {
            jpql.append("AND 1=1 ");
            if (from != null) jpql.append("AND b.startAt >= :from ");
            if (to != null) jpql.append("AND b.startAt <= :to ");
        }
        jpql.append("WHERE f.owner.id = :managerId GROUP BY f.id, f.name");

        TypedQuery<Object[]> q = em.createQuery(jpql.toString(), Object[].class)
                .setParameter("confirmed", Booking.BookingStatus.CONFIRMED)
                .setParameter("managerId", managerId);
        if (from != null) q.setParameter("from", from);
        if (to != null) q.setParameter("to", to);

        List<FieldStatsItem> items = new ArrayList<>();
        for (Object[] row : q.getResultList()) {
            UUID fId = (UUID) row[0];
            String fName = (String) row[1];
            long confirmedCount = ((Number) row[2]).longValue();
            BigDecimal rev = row[3] instanceof BigDecimal ? (BigDecimal) row[3] : BigDecimal.valueOf(((Number) row[3]).doubleValue());
            items.add(new FieldStatsItem(fId, fName, confirmedCount, rev));
        }
        return items;
    }

    public Map<String, Long> countByStatusAdmin() {
        List<Object[]> rows = em.createQuery(
                "SELECT b.status, COUNT(b) FROM Booking b GROUP BY b.status", Object[].class)
                .getResultList();
        Map<String, Long> res = new HashMap<>();
        for (Object[] r : rows) {
            res.put(r[0].toString(), (Long) r[1]);
        }
        return res;
    }

    public BigDecimal sumRevenueAdmin() {
        BigDecimal sum = em.createQuery(
                "SELECT SUM(b.totalAmount) FROM Booking b WHERE b.status = :confirmed", BigDecimal.class)
                .setParameter("confirmed", Booking.BookingStatus.CONFIRMED)
                .getSingleResult();
        return sum != null ? sum : BigDecimal.ZERO;
    }
}
