package com.sports.footballbooking.dto;

public record SlotResponse(
        String time,
        String status,
        boolean available
) {
    public SlotResponse(String time, String status) {
        this(time, status, "available".equalsIgnoreCase(status));
    }
}
