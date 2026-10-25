package com.sports.footballbooking.exception;

/**
 * Thrown when a business rule is violated (e.g., double booking, invalid operation).
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
