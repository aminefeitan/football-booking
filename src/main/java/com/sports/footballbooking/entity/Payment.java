package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Represents a payment transaction for a football pitch booking.
 * Payment status enum is embedded directly in this model.
 */
@Entity
@Table(name = "payments")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@NamedQueries({
        @NamedQuery(name = "Payment.findByUser",
                query = "SELECT p FROM Payment p WHERE p.user.id = :userId ORDER BY p.createdAt DESC"),
        @NamedQuery(name = "Payment.findByBooking",
                query = "SELECT p FROM Payment p WHERE p.booking.id = :bookingId")
})
public class Payment extends BaseEntity {

    public enum Status {
        PENDING,
        COMPLETED,
        FAILED,
        REFUNDED
    }

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "booking_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Booking booking;

    @NotNull
    @Positive
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Size(max = 3)
    @Column(nullable = false, length = 3)
    private String currency = "MAD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Size(max = 50)
    @Column(name = "payment_method", length = 50)
    private String paymentMethod; // CREDIT_CARD, CASH, STRIPE, CMI

    @Size(max = 255)
    @Column(name = "transaction_ref", length = 255)
    private String transactionRef;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    public Payment() {}

    public Payment(User user, Booking booking, BigDecimal amount, String paymentMethod) {
        this.user = user;
        this.booking = booking;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.currency = (booking != null && booking.getCurrency() != null) ? booking.getCurrency() : "MAD";
        this.status = Status.PENDING;
    }

    public void markCompleted(String transactionRef) {
        this.status = Status.COMPLETED;
        this.transactionRef = transactionRef;
        this.paidAt = OffsetDateTime.now();
    }

    public void markFailed(String reason) {
        this.status = Status.FAILED;
        this.transactionRef = reason;
    }

    // Getters and Setters
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }
    public OffsetDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(OffsetDateTime paidAt) { this.paidAt = paidAt; }
}
