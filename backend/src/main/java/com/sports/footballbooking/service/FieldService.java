package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.FieldRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
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

    @Inject
    private FieldRepository fieldRepository;

    @Inject
    private UserRepository userRepository;

    // ==================== DTO compact ====================

    public record FieldRequest(
            @NotBlank String name,
            String description,
            String address,
            String city,
            String postalCode,
            BigDecimal latitude,
            BigDecimal longitude,
            String phone,
            String fieldType,
            String surfaceType,
            Integer capacity,
            @NotNull @Positive BigDecimal pricePerHour,
            String currency,
            boolean indoor,
            boolean hasLights,
            boolean hasLockerRoom,
            boolean hasParking
    ) {}

    // ==================== Méthodes ====================

    public List<Field> getAllActiveFields() {
        return fieldRepository.findAllActive();
    }

    public Field getFieldById(UUID id) {
        return fieldRepository.getById(id);
    }

    public List<Field> searchFields(String city, String fieldType, Double maxPrice, Boolean indoor, Boolean hasLights) {
        return fieldRepository.searchFields(city, fieldType, maxPrice, indoor, hasLights);
    }

    public Field createField(FieldRequest req, UUID ownerId) {
        String type = req.fieldType() != null ? req.fieldType() : "5v5";
        Field field = new Field(req.name(), req.city(), type, req.pricePerHour());
        applyRequest(field, req);

        if (ownerId != null) {
            userRepository.findById(ownerId).ifPresent(field::setOwner);
        }

        LOG.info("Création du terrain: " + field.getName());
        return fieldRepository.save(field);
    }

    public Field updateField(UUID fieldId, FieldRequest req) {
        Field field = getFieldById(fieldId);
        applyRequest(field, req);
        LOG.info("Mise à jour du terrain: " + field.getName());
        return fieldRepository.save(field);
    }

    public void deactivateField(UUID fieldId) {
        Field field = getFieldById(fieldId);
        field.setActive(false);
        fieldRepository.save(field);
        LOG.info("Terrain désactivé: " + field.getName());
    }

    // ==================== Helper ====================

    private void applyRequest(Field field, FieldRequest req) {
        field.setDescription(req.description());
        field.setAddress(req.address());
        field.setCity(req.city());
        field.setPostalCode(req.postalCode());
        field.setLatitude(req.latitude());
        field.setLongitude(req.longitude());
        field.setPhone(req.phone());
        if (req.fieldType() != null) field.setFieldType(req.fieldType());
        field.setSurfaceType(req.surfaceType());
        field.setCapacity(req.capacity());
        field.setPricePerHour(req.pricePerHour());
        field.setIndoor(req.indoor());
        field.setHasLights(req.hasLights());
        field.setHasLockerRoom(req.hasLockerRoom());
        field.setHasParking(req.hasParking());
        if (req.currency() != null && !req.currency().isBlank()) field.setCurrency(req.currency());
    }
}
