package com.sports.footballbooking.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalTime;

public record FieldRequest(
        @NotBlank @Size(max = 150) String name,
        String description,
        @NotBlank @Size(max = 255) String address,
        @NotBlank @Size(max = 100) String city,
        BigDecimal latitude,
        BigDecimal longitude,
        @Size(max = 20) String phone,
        @NotBlank @Pattern(regexp = "5v5|7v7|11v11", message = "Le type de terrain doit être 5v5, 7v7 ou 11v11") String fieldType,
        @Size(max = 50) String surfaceType,
        @PositiveOrZero Integer capacity,
        @NotNull @Positive @Digits(integer = 8, fraction = 2) BigDecimal pricePerHour,
        boolean indoor,
        boolean hasLights,
        boolean hasLockerRoom,
        boolean hasParking,
        @NotNull LocalTime openTime,
        @NotNull LocalTime closeTime
) {}
