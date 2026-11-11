package com.sports.footballbooking.config;

import com.sports.footballbooking.entity.Player;
import com.sports.footballbooking.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        userId = UUID.randomUUID();
        testUser = new Player("player@example.com", "hash", "Achraf", "Hakimi");
        testUser.setId(userId);
    }

    @Test
    @DisplayName("Génération et validation d'un JWT valide")
    void testGenerateAndValidateValidToken() {
        String token = jwtService.generateToken(testUser);
        assertNotNull(token);
        assertEquals(3, token.split("\\.").length);

        JwtService.JwtClaims claims = jwtService.validateToken(token);
        assertNotNull(claims);
        assertEquals(userId, claims.userId());
        assertEquals("player@example.com", claims.email());
        assertEquals("PLAYER", claims.role());
    }

    @Test
    @DisplayName("Rejet d'un JWT dont le payload a été altéré (usurpation d'identité)")
    void testRejectTamperedPayload() {
        String token = jwtService.generateToken(testUser);
        String[] parts = token.split("\\.");

        // On remplace une lettre dans le payload encodé pour simuler une modification illicite
        char alteredChar = parts[1].charAt(5) == 'A' ? 'B' : 'A';
        String tamperedPayload = parts[1].substring(0, 5) + alteredChar + parts[1].substring(6);
        String forgedToken = parts[0] + "." + tamperedPayload + "." + parts[2];

        JwtService.JwtClaims claims = jwtService.validateToken(forgedToken);
        assertNull(claims, "Le token avec payload falsifié doit être formellement rejeté");
    }

    @Test
    @DisplayName("Rejet d'un JWT avec fausse signature")
    void testRejectInvalidSignature() {
        String token = jwtService.generateToken(testUser);
        String[] parts = token.split("\\.");

        String forgedToken = parts[0] + "." + parts[1] + ".fakeSignature1234567890";

        JwtService.JwtClaims claims = jwtService.validateToken(forgedToken);
        assertNull(claims, "Le token avec signature erronée doit être rejeté");
    }

    @Test
    @DisplayName("Rejet d'un token null ou malformé")
    void testRejectMalformedToken() {
        assertNull(jwtService.validateToken(null));
        assertNull(jwtService.validateToken(""));
        assertNull(jwtService.validateToken("just-a-string"));
        assertNull(jwtService.validateToken("header.payload"));
    }
}

