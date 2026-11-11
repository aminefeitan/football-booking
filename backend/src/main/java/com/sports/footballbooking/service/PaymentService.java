package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Payment;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.repository.PaymentRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@Transactional
public class PaymentService {

    @Inject
    private PaymentRepository paymentRepository;

    @Inject
    private UserRepository userRepository;

    @Inject
    private BookingService bookingService;

    // ==================== DTO compact ====================

    public record PaymentRequest(
            @NotNull UUID bookingId,
            @NotBlank String paymentMethod
    ) {}

    // ==================== Méthodes ====================

    public Payment processPayment(UUID userId, PaymentRequest request) {
        User user = userRepository.getById(userId);

        if (request.bookingId() == null) throw new BusinessException("Le paiement doit référencer une réservation");

        Booking booking = bookingService.getBookingById(request.bookingId());

        String txRef = "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Payment payment = new Payment(user, booking, booking.getTotalAmount(), request.paymentMethod());
        payment.markCompleted(txRef);
        paymentRepository.save(payment);

        // Confirmer la réservation
        bookingService.confirmBooking(booking.getId());

        return payment;
    }

    public List<Payment> getUserPayments(UUID userId) {
        return paymentRepository.findByUser(userId);
    }
}
