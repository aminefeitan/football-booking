package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents a booking (reservation) of a field by a user.
 * Lifecycle status enum is embedded directly in this model.
 */
@Entity
@Table(name = "bookings")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@NamedQueries({
        @NamedQuery(name = "Booking.findByUser",
                query = "SELECT b FROM Booking b WHERE b.user.id = :userId ORDER BY b.startAt DESC"),
        @NamedQuery(name = "Booking.findByField",
                query = "SELECT b FROM Booking b WHERE b.field.id = :fieldId AND b.status IN (com.sports.footballbooking.entity.Booking.Status.PENDING_PAYMENT, com.sports.footballbooking.entity.Booking.Status.CONFIRMED) ORDER BY b.startAt"),
        @NamedQuery(name = "Booking.findOverlapping",
                query = "SELECT b FROM Booking b WHERE b.field.id = :fieldId " +
                        "AND b.status IN (com.sports.footballbooking.entity.Booking.Status.PENDING_PAYMENT, " +
                        "com.sports.footballbooking.entity.Booking.Status.CONFIRMED) " +
                        "AND b.startAt < :endAt AND b.endAt > :startAt"),
        @NamedQuery(name = "Booking.findExpired",
                query = "SELECT b FROM Booking b WHERE b.status = com.sports.footballbooking.entity.Booking.Status.PENDING_PAYMENT " +
                        "AND b.expiresAt IS NOT NULL AND b.expiresAt < :now")
})
public class Booking {

    public enum Status {
        PENDING_PAYMENT,
        CONFIRMED,
        CANCELLED,
        COMPLETED,
        EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "field_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Field field;

    @NotNull
    @Column(name = "start_at", nullable = false)
    private OffsetDateTime startAt;

    @NotNull
    @Column(name = "end_at", nullable = false)
    private OffsetDateTime endAt;

    @NotNull
    @Positive
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 3)
    private String currency = "MAD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING_PAYMENT;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Booking() {
        // Required by JPA
    }

    public Booking(User user, Field field, OffsetDateTime startAt, OffsetDateTime endAt,
                   BigDecimal totalAmount) {
        this.user = user;
        this.field = field;
        this.startAt = startAt;
        this.endAt = endAt;
        this.totalAmount = totalAmount;
        this.currency = field.getCurrency();
        this.status = Status.PENDING_PAYMENT;
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.expiresAt == null && this.status == Status.PENDING_PAYMENT) {
            this.expiresAt = now.plusMinutes(15);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public void confirm() {
        if (this.status != Status.PENDING_PAYMENT) {
            throw new IllegalStateException("Only PENDING_PAYMENT bookings can be confirmed");
        }
        this.status = Status.CONFIRMED;
        this.expiresAt = null;
    }

    public void cancel(String reason) {
        if (this.status == Status.CANCELLED || this.status == Status.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a " + this.status + " booking");
        }
        this.status = Status.CANCELLED;
        this.cancelledAt = OffsetDateTime.now();
        this.cancellationReason = reason;
    }

    public void expire() {
        if (this.status != Status.PENDING_PAYMENT) {
            throw new IllegalStateException("Only PENDING_PAYMENT bookings can expire");
        }
        this.status = Status.EXPIRED;
    }

    public void complete() {
        if (this.status != Status.CONFIRMED) {
            throw new IllegalStateException("Only CONFIRMED bookings can be completed");
        }
        this.status = Status.COMPLETED;
    }

    // ==================== Getters ====================

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public Field getField() { return field; }
    public OffsetDateTime getStartAt() { return startAt; }
    public OffsetDateTime getEndAt() { return endAt; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getCurrency() { return currency; }
    public Status getStatus() { return status; }
    public String getNotes() { return notes; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public OffsetDateTime getCancelledAt() { return cancelledAt; }
    public String getCancellationReason() { return cancellationReason; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    // ==================== Setters ====================

    public void setNotes(String notes) { this.notes = notes; }
}
