package com.sports.footballbooking.dto;

import com.sports.footballbooking.entity.Field;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record FieldResponse(
        UUID id,
        UUID ownerId,
        String ownerName,
        String name,
        String description,
        String address,
        String city,
        BigDecimal latitude,
        BigDecimal longitude,
        String phone,
        String fieldType,
        String surfaceType,
        Integer capacity,
        BigDecimal pricePerHour,
        String currency,
        boolean indoor,
        boolean hasLights,
        boolean hasLockerRoom,
        boolean hasParking,
        LocalTime openTime,
        LocalTime closeTime,
        Field.FieldStatus status,
        UUID reviewedById,
        OffsetDateTime createdAt
) {
    public static FieldResponse from(Field field) {
        if (field == null) return null;
        String ownerName = field.getOwner() != null
                ? field.getOwner().getFirstName() + " " + field.getOwner().getLastName()
                : null;
        UUID ownerId = field.getOwner() != null ? field.getOwner().getId() : null;
        UUID reviewedById = field.getReviewedBy() != null ? field.getReviewedBy().getId() : null;

        return new FieldResponse(
                field.getId(),
                ownerId,
                ownerName,
                field.getName(),
                field.getDescription(),
                field.getAddress(),
                field.getCity(),
                field.getLatitude(),
                field.getLongitude(),
                field.getPhone(),
                field.getFieldType(),
                field.getSurfaceType(),
                field.getCapacity(),
                field.getPricePerHour(),
                field.getCurrency(),
                field.isIndoor(),
                field.isHasLights(),
                field.isHasLockerRoom(),
                field.isHasParking(),
                field.getOpenTime(),
                field.getCloseTime(),
                field.getStatus(),
                reviewedById,
                field.getCreatedAt()
        );
    }
}
