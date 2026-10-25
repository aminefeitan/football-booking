package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;

@ApplicationScoped
@Transactional
public class FieldService {

    private static final Logger LOG = Logger.getLogger(FieldService.class.getName());

    @PersistenceContext(unitName = "footballBookingPU")
    private EntityManager em;

    // ==================== Requête imbriquée ====================

    public static class FieldRequest {
        @NotBlank public String name;
        public String description;
        public String address;
        public String city;
        public String postalCode;
        public BigDecimal latitude;
        public BigDecimal longitude;
        public String phone;
        public String fieldType = "5v5";
        public String surfaceType;
        public Integer capacity;
        @NotNull @Positive public BigDecimal pricePerHour;
        public String currency;
        public boolean indoor;
        public boolean hasLights;
        public boolean hasLockerRoom;
        public boolean hasParking;
    }

    // ==================== Méthodes ====================

    public List<Field> getAllActiveFields() {
        return em.createNamedQuery("Field.findAllActive", Field.class).getResultList();
    }

    public Field getFieldById(UUID id) {
        Field field = em.find(Field.class, id);
        if (field == null) throw new NotFoundException("Field", id);
        return field;
    }

    public List<Field> searchFields(String city, String fieldType, Double maxPrice, Boolean indoor, Boolean hasLights) {
        StringBuilder jpql = new StringBuilder("SELECT f FROM Field f WHERE f.active = true");
        if (city != null && !city.isBlank()) jpql.append(" AND LOWER(f.city) = LOWER(:city)");
        if (fieldType != null && !fieldType.isBlank()) jpql.append(" AND f.fieldType = :fieldType");
        if (maxPrice != null) jpql.append(" AND f.pricePerHour <= :maxPrice");
        if (indoor != null) jpql.append(" AND f.indoor = :indoor");
        if (hasLights != null) jpql.append(" AND f.hasLights = :hasLights");
        jpql.append(" ORDER BY f.name");

        var query = em.createQuery(jpql.toString(), Field.class);
        if (city != null && !city.isBlank()) query.setParameter("city", city);
        if (fieldType != null && !fieldType.isBlank()) query.setParameter("fieldType", fieldType);
        if (maxPrice != null) query.setParameter("maxPrice", BigDecimal.valueOf(maxPrice));
        if (indoor != null) query.setParameter("indoor", indoor);
        if (hasLights != null) query.setParameter("hasLights", hasLights);

        return query.getResultList();
    }

    public Field createField(FieldRequest request, UUID ownerId) {
        Field field = new Field(request.name, request.city, request.fieldType, request.pricePerHour);
        applyRequest(field, request);

        if (ownerId != null) {
            User owner = em.find(User.class, ownerId);
            if (owner != null) field.setOwner(owner);
        }

        LOG.info("Création du terrain: " + field.getName());
        em.persist(field);
        return field;
    }

    public Field updateField(UUID fieldId, FieldRequest request) {
        Field field = getFieldById(fieldId);
        applyRequest(field, request);
        LOG.info("Mise à jour du terrain: " + field.getName());
        return em.merge(field);
    }

    public void deactivateField(UUID fieldId) {
        Field field = getFieldById(fieldId);
        field.setActive(false);
        em.merge(field);
        LOG.info("Terrain désactivé: " + field.getName());
    }

    // ==================== Helper privé ====================

    private void applyRequest(Field field, FieldRequest req) {
        field.setDescription(req.description);
        field.setAddress(req.address);
        field.setCity(req.city);
        field.setPostalCode(req.postalCode);
        field.setLatitude(req.latitude);
        field.setLongitude(req.longitude);
        field.setPhone(req.phone);
        field.setFieldType(req.fieldType != null ? req.fieldType : "5v5");
        field.setSurfaceType(req.surfaceType);
        field.setCapacity(req.capacity);
        field.setPricePerHour(req.pricePerHour);
        field.setIndoor(req.indoor);
        field.setHasLights(req.hasLights);
        field.setHasLockerRoom(req.hasLockerRoom);
        field.setHasParking(req.hasParking);
        if (req.currency != null && !req.currency.isBlank()) field.setCurrency(req.currency);
    }
}
