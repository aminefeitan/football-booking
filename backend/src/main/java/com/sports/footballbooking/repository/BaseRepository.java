package com.sports.footballbooking.repository;

import com.sports.footballbooking.entity.BaseEntity;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Base Repository générique pour toutes les entités de l'application.
 * Fournit les opérations CRUD communes et l'accès à la Criteria API (sans SQL sous forme de chaînes).
 */
public abstract class BaseRepository<T extends BaseEntity> {

    @PersistenceContext(unitName = "footballBookingPU")
    protected EntityManager em;

    protected final Class<T> entityClass;

    protected BaseRepository() {
        this.entityClass = null;
    }

    protected BaseRepository(Class<T> entityClass) {
        this.entityClass = entityClass;
    }

    public T getById(UUID id) {
        T entity = em.find(entityClass, id);
        if (entity == null) {
            throw new NotFoundException(entityClass.getSimpleName(), id);
        }
        return entity;
    }

    public Optional<T> findById(UUID id) {
        return Optional.ofNullable(em.find(entityClass, id));
    }

    public List<T> findAll() {
        CriteriaBuilder cb = cb();
        CriteriaQuery<T> cq = newQuery();
        Root<T> root = cq.from(entityClass);
        cq.select(root);
        return em.createQuery(cq).getResultList();
    }

    public T save(T entity) {
        if (entity.getId() == null) {
            em.persist(entity);
            return entity;
        }
        return em.merge(entity);
    }

    public void delete(UUID id) {
        T entity = getById(id);
        em.remove(entity);
    }

    public void delete(T entity) {
        if (entity != null) {
            em.remove(em.contains(entity) ? entity : em.merge(entity));
        }
    }

    public Optional<T> findOneBy(String fieldName, Object value) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<T> cq = newQuery();
        Root<T> root = cq.from(entityClass);
        cq.select(root).where(cb.equal(root.get(fieldName), value));
        List<T> results = em.createQuery(cq).setMaxResults(1).getResultList();
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<T> findListBy(String fieldName, Object value) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<T> cq = newQuery();
        Root<T> root = cq.from(entityClass);
        cq.select(root).where(cb.equal(root.get(fieldName), value));
        return em.createQuery(cq).getResultList();
    }

    public boolean existsBy(String fieldName, Object value) {
        CriteriaBuilder cb = cb();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<T> root = cq.from(entityClass);
        cq.select(cb.count(root)).where(cb.equal(root.get(fieldName), value));
        return em.createQuery(cq).getSingleResult() > 0;
    }

    public void flush() {
        em.flush();
    }

    protected CriteriaBuilder cb() {
        return em.getCriteriaBuilder();
    }

    protected CriteriaQuery<T> newQuery() {
        return cb().createQuery(entityClass);
    }
}

