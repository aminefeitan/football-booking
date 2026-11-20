package com.sports.footballbooking.dto;

import com.sports.footballbooking.entity.Booking;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID matchId,
        UUID userId,
        String userName,
        UUID fieldId,
        String fieldName,
        OffsetDateTime startAt,
        OffsetDateTime endAt,
        BigDecimal totalAmount,
        String currency,
        String notes,
        Booking.BookingStatus status,
        UUID handledById,
        OffsetDateTime handledAt,
        OffsetDateTime cancelledAt,
        String reason,
        OffsetDateTime createdAt
) {
    public static BookingResponse from(Booking booking) {
        if (booking == null) return null;
        String userName = booking.getUser() != null
                ? booking.getUser().getFirstName() + " " + booking.getUser().getLastName()
                : null;
        String fieldName = booking.getField() != null ? booking.getField().getName() : null;
        UUID handledById = booking.getHandledBy() != null ? booking.getHandledBy().getId() : null;

        return new BookingResponse(
                booking.getId(),
                booking.getMatch() != null ? booking.getMatch().getId() : null,
                booking.getUser() != null ? booking.getUser().getId() : null,
                userName,
                booking.getField() != null ? booking.getField().getId() : null,
                fieldName,
                booking.getStartAt(),
                booking.getEndAt(),
                booking.getTotalAmount(),
                booking.getCurrency(),
                booking.getNotes(),
                booking.getStatus(),
                handledById,
                booking.getHandledAt(),
                booking.getCancelledAt(),
                booking.getReason(),
                booking.getCreatedAt()
        );
    }
}
