package com.sports.footballbooking.service;

import com.sports.footballbooking.dto.FieldRequest;
import com.sports.footballbooking.dto.FieldResponse;
import com.sports.footballbooking.dto.SlotResponse;
import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.BookingRepository;
import com.sports.footballbooking.repository.FieldRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class FieldService {

    public static final ZoneId ZONE = ZoneId.of("Africa/Casablanca");

    @Inject
    private FieldRepository fieldRepository;

    @Inject
    private UserRepository userRepository;

    @Inject
    private BookingRepository bookingRepository;

    public List<FieldResponse> searchApprovedFields(String city, String fieldType, BigDecimal maxPrice,
                                                    Boolean indoor, Boolean hasLights, Integer page, Integer size) {
        return fieldRepository.search(city, fieldType, maxPrice, indoor, hasLights, page, size).stream()
                .map(FieldResponse::from)
                .toList();
    }

    public List<FieldResponse> searchApprovedFields(String city, String fieldType, BigDecimal maxPrice,
                                                    Boolean indoor, Boolean hasLights) {
        return searchApprovedFields(city, fieldType, maxPrice, indoor, hasLights, null, null);
    }

    public FieldResponse getFieldDetails(UUID fieldId, UUID currentUserId, boolean isAdmin) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new NotFoundException("Terrain introuvable"));

        // Only APPROVED fields are visible to general public/players
        if (field.getStatus() != Field.FieldStatus.APPROVED) {
            boolean isOwner = currentUserId != null && field.getOwner().getId().equals(currentUserId);
            if (!isOwner && !isAdmin) {
                throw new NotFoundException("Terrain introuvable ou non approuvé");
            }
        }

        return FieldResponse.from(field);
    }

    public List<FieldResponse> findByOwner(UUID ownerId) {
        return fieldRepository.findByOwner(ownerId).stream()
                .map(FieldResponse::from)
                .toList();
    }

    public List<FieldResponse> findForAdmin(Field.FieldStatus status) {
        Field.FieldStatus targetStatus = status != null ? status : Field.FieldStatus.PENDING;
        return fieldRepository.findByStatus(targetStatus).stream()
                .map(FieldResponse::from)
                .toList();
    }

    @Transactional
    public FieldResponse createField(UUID ownerId, FieldRequest req) {
        if (!req.openTime().isBefore(req.closeTime())) {
            throw new BadRequestException("L'heure d'ouverture doit précéder l'heure de fermeture");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new NotFoundException("Gérant introuvable"));

        Field field = new Field();
        field.setOwner(owner);
        applyData(field, req);
        field.setStatus(Field.FieldStatus.PENDING); // New field is always PENDING

        fieldRepository.persist(field);
        return FieldResponse.from(field);
    }

    @Transactional
    public FieldResponse updateField(UUID fieldId, UUID callerId, boolean isAdmin, FieldRequest req) {
        if (!req.openTime().isBefore(req.closeTime())) {
            throw new BadRequestException("L'heure d'ouverture doit précéder l'heure de fermeture");
        }

        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new NotFoundException("Terrain introuvable"));

        boolean isOwner = field.getOwner().getId().equals(callerId);
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Vous n'êtes pas propriétaire de ce terrain");
        }

        applyData(field, req);
        // Note: modification by owner does not change status

        return FieldResponse.from(field);
    }

    @Transactional
    public FieldResponse reviewFieldStatus(UUID fieldId, UUID adminId, Field.FieldStatus newStatus) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new NotFoundException("Terrain introuvable"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("Administrateur introuvable"));

        field.setStatus(newStatus);
        field.setReviewedBy(admin);

        return FieldResponse.from(field);
    }

    public List<SlotResponse> getFieldSlots(UUID fieldId, LocalDate date, UUID currentUserId, boolean isAdmin) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new NotFoundException("Terrain introuvable"));

        if (field.getStatus() != Field.FieldStatus.APPROVED) {
            boolean isOwner = currentUserId != null && field.getOwner().getId().equals(currentUserId);
            if (!isOwner && !isAdmin) {
                throw new NotFoundException("Terrain introuvable ou non approuvé");
            }
        }

        LocalDate targetDate = date != null ? date : LocalDate.now(ZONE);
        OffsetDateTime dayStart = targetDate.atStartOfDay(ZONE).toOffsetDateTime();
        OffsetDateTime dayEnd = targetDate.plusDays(1).atStartOfDay(ZONE).toOffsetDateTime();

        List<Booking> activeBookings = bookingRepository.findActiveBetween(fieldId, dayStart, dayEnd);

        List<SlotResponse> slots = new ArrayList<>();
        LocalTime current = field.getOpenTime();
        LocalTime close = field.getCloseTime();

        while (current.plusHours(1).compareTo(close) <= 0 && !current.plusHours(1).equals(current)) {
            LocalTime next = current.plusHours(1);
            OffsetDateTime slotStart = targetDate.atTime(current).atZone(ZONE).toOffsetDateTime();
            OffsetDateTime slotEnd = targetDate.atTime(next).atZone(ZONE).toOffsetDateTime();

            boolean occupied = activeBookings.stream().anyMatch(b ->
                    b.getStartAt().isBefore(slotEnd) && b.getEndAt().isAfter(slotStart));

            String timeLabel = String.format("%02d:00", current.getHour());
            slots.add(new SlotResponse(timeLabel, occupied ? "reserved" : "available", !occupied));

            current = next;
        }

        return slots;
    }

    private void applyData(Field field, FieldRequest req) {
        field.setName(req.name().trim());
        field.setAddress(req.address().trim());
        field.setCity(req.city().trim());
        field.setDescription(req.description() != null ? req.description().trim() : null);
        field.setLatitude(req.latitude());
        field.setLongitude(req.longitude());
        field.setPhone(req.phone() != null ? req.phone().trim() : null);
        field.setFieldType(req.fieldType());
        field.setSurfaceType(req.surfaceType() != null ? req.surfaceType().trim() : null);
        field.setCapacity(req.capacity());
        field.setPricePerHour(req.pricePerHour());
        field.setIndoor(req.indoor());
        field.setHasLights(req.hasLights());
        field.setHasLockerRoom(req.hasLockerRoom());
        field.setHasParking(req.hasParking());
        field.setOpenTime(req.openTime());
        field.setCloseTime(req.closeTime());
    }
}
