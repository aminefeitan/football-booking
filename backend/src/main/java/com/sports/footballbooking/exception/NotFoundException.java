package com.sports.footballbooking.exception;

/**
 * Thrown when a requested resource is not found.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String entityName, Object id) {
        super(entityName + " not found with ID: " + id);
    }
}
