package com.sports.footballbooking.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.sports.footballbooking.repository.UserRepository;
import com.sports.footballbooking.service.AuthService;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    private static final String SECRET = "super-secret-key-at-least-32-chars-long-123456";
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() throws Exception {
        jwtService = new JwtService();
        setSecret(jwtService, SECRET);
        jwtService.init();

        Field jwtField = AuthService.class.getDeclaredField("jwtService");
        jwtField.setAccessible(true);
        jwtField.set(authService, jwtService);
    }

    private void setSecret(JwtService service, String secret) throws Exception {
        Field secretField = JwtService.class.getDeclaredField("jwtSecretConfig");
        secretField.setAccessible(true);
        secretField.set(service, Optional.ofNullable(secret));
    }

    @Test
    @DisplayName("Validation d'un token valide généré")
    void testValidToken() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateToken(userId);

        Optional<UUID> extractedId = jwtService.validate(token);
        assertTrue(extractedId.isPresent());
        assertEquals(userId, extractedId.get());
    }

    @Test
    @DisplayName("4. Signature JWT : token signé avec un mauvais secret rejeté (401)")
    void testWrongSecretSignatureRejected() {
        UUID userId = UUID.randomUUID();
        String invalidToken = JWT.create()
                .withIssuer("football-booking")
                .withSubject(userId.toString())
                .withIssuedAt(Instant.now())
                .withExpiresAt(Instant.now().plus(8, ChronoUnit.HOURS))
                .sign(Algorithm.HMAC256("another-completely-different-secret-key-32ch"));

        Optional<UUID> result = jwtService.validate(invalidToken);
        assertTrue(result.isEmpty(), "Le token avec mauvaise signature doit être rejeté");

        assertThrows(NotAuthorizedException.class, () -> authService.authenticate(invalidToken));
    }

    @Test
    @DisplayName("4. Expiration JWT : token expiré rejeté (401)")
    void testExpiredTokenRejected() {
        UUID userId = UUID.randomUUID();
        String expiredToken = JWT.create()
                .withIssuer("football-booking")
                .withSubject(userId.toString())
                .withIssuedAt(Instant.now().minus(2, ChronoUnit.HOURS))
                .withExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .sign(Algorithm.HMAC256(SECRET));

        Optional<UUID> result = jwtService.validate(expiredToken);
        assertTrue(result.isEmpty(), "Le token expiré doit être rejeté");

        assertThrows(NotAuthorizedException.class, () -> authService.authenticate(expiredToken));
    }

    @Test
    @DisplayName("Refus de démarrage si jwt.secret absent ou < 32 caractères")
    void testSecretValidationAtStartup() throws Exception {
        JwtService invalidService = new JwtService();
        setSecret(invalidService, "too-short");

        assertThrows(IllegalStateException.class, invalidService::init);

        setSecret(invalidService, "");
        assertThrows(IllegalStateException.class, invalidService::init);

        setSecret(invalidService, null);
        assertThrows(IllegalStateException.class, invalidService::init);
    }
}
