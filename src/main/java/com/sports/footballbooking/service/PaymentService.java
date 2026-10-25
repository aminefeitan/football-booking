package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Payment;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@Transactional
public class PaymentService {

    @PersistenceContext(unitName = "footballBookingPU")
    private EntityManager em;

    @Inject
    private BookingService bookingService;

    // ==================== Requête imbriquée ====================

    public static class PaymentRequest {
        @NotNull public UUID bookingId;
        @NotBlank public String paymentMethod;
    }

    // ==================== Méthodes ====================

    public Payment processPayment(UUID userId, PaymentRequest request) {
        User user = em.find(User.class, userId);
        if (user == null) throw new NotFoundException("User", userId);

        if (request.bookingId == null) throw new BusinessException("Le paiement doit référencer une réservation");

        Booking booking = em.find(Booking.class, request.bookingId);
        if (booking == null) throw new NotFoundException("Booking", request.bookingId);

        String txRef = "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Payment payment = new Payment(user, booking, booking.getTotalAmount(), request.paymentMethod);
        payment.markCompleted(txRef);
        em.persist(payment);

        // Confirmer la réservation
        bookingService.confirmBooking(booking.getId());

        return payment;
    }

    public List<Payment> getUserPayments(UUID userId) {
        return em.createNamedQuery("Payment.findByUser", Payment.class)
                .setParameter("userId", userId)
                .getResultList();
    }
}
