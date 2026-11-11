package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.Match;
import com.sports.footballbooking.entity.MatchParticipant;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class MatchRepository extends BaseRepository<Match> {

    public MatchRepository() {
        super(Match.class);
    }

    public List<Match> findUpcoming(String city) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Match> cq = newQuery();
        Root<Match> root = cq.from(Match.class);
        OffsetDateTime now = OffsetDateTime.now();

        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isTrue(root.get("isPublic")));
        predicates.add(cb.greaterThan(root.get("matchDate"), now));
        predicates.add(cb.notEqual(root.get("status"), "CANCELLED"));

        if (city != null && !city.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
        }

        cq.where(predicates.toArray(new Predicate[0])).orderBy(cb.asc(root.get("matchDate")));
        return em.createQuery(cq).getResultList();
    }

    // ==================== Participants ====================

    public List<MatchParticipant> findParticipants(UUID matchId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<MatchParticipant> cq = cb.createQuery(MatchParticipant.class);
        Root<MatchParticipant> root = cq.from(MatchParticipant.class);
        cq.where(cb.equal(root.get("match").get("id"), matchId))
          .orderBy(cb.asc(root.get("joinedAt")));
        return em.createQuery(cq).getResultList();
    }

    public boolean isParticipant(UUID matchId, UUID userId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<MatchParticipant> root = cq.from(MatchParticipant.class);
        cq.select(cb.count(root)).where(
                cb.equal(root.get("match").get("id"), matchId),
                cb.equal(root.get("user").get("id"), userId)
        );
        return em.createQuery(cq).getSingleResult() > 0;
    }

    public Optional<MatchParticipant> findParticipant(UUID matchId, UUID userId) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<MatchParticipant> cq = cb.createQuery(MatchParticipant.class);
        Root<MatchParticipant> root = cq.from(MatchParticipant.class);
        cq.where(
                cb.equal(root.get("match").get("id"), matchId),
                cb.equal(root.get("user").get("id"), userId)
        );
        List<MatchParticipant> list = em.createQuery(cq).getResultList();
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public void removeParticipant(UUID matchId, UUID userId) {
        MatchParticipant participant = findParticipant(matchId, userId)
                .orElseThrow(() -> new NotFoundException("Participant introuvable pour ce match"));
        em.remove(participant);
    }

    public void persistParticipant(MatchParticipant participant) {
        em.persist(participant);
    }
}

