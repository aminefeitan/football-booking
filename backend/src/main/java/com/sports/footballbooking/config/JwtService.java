package com.sports.footballbooking.config;

import com.sports.footballbooking.entity.User;
import jakarta.enterprise.context.ApplicationScoped;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service autonome de génération et validation de tokens JWT conformes RFC 7519 (HMAC-SHA256).
 * 100% pur Java standard, zéro dépendance externe.
 */
@ApplicationScoped
public class JwtService {

    private static final Logger LOG = Logger.getLogger(JwtService.class.getName());
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final long DEFAULT_EXPIRATION_SECONDS = 86400L * 7L; // 7 jours

    private static final String SECRET_KEY = resolveSecretKey();

    private static final String JWT_HEADER_BASE64 = Base64.getUrlEncoder().withoutPadding().encodeToString(
            "{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8)
    );

    public record JwtClaims(UUID userId, String email, String role, long expiresAt) {}

    /**
     * Génère un vrai token JWT signé cryptographiquement avec HMAC-SHA256.
     */
    public String generateToken(User user) {
        long now = Instant.now().getEpochSecond();
        long exp = now + DEFAULT_EXPIRATION_SECONDS;

        String safeRole = user.getRole() != null ? user.getRole().name() : "PLAYER";
        String payloadJson = String.format(
                "{\"sub\":\"%s\",\"email\":\"%s\",\"role\":\"%s\",\"iat\":%d,\"exp\":%d}",
                user.getId(),
                escapeJson(user.getEmail()),
                safeRole,
                now,
                exp
        );

        String payloadBase64 = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

        String contentToSign = JWT_HEADER_BASE64 + "." + payloadBase64;
        String signatureBase64 = sign(contentToSign);

        return contentToSign + "." + signatureBase64;
    }

    /**
     * Valide la signature cryptographique du JWT et extrait les claims.
     * Retourne null si le token est invalide, expiré ou falsifié.
     */
    public JwtClaims validateToken(String token) {
        if (token == null || token.isBlank()) return null;

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }

        String headerBase64 = parts[0];
        String payloadBase64 = parts[1];
        String signatureBase64 = parts[2];

        // 1. Vérification de la signature cryptographique HMAC en temps constant
        String contentToSign = headerBase64 + "." + payloadBase64;
        String expectedSignature = sign(contentToSign);

        byte[] receivedSigBytes = signatureBase64.getBytes(StandardCharsets.UTF_8);
        byte[] expectedSigBytes = expectedSignature.getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(receivedSigBytes, expectedSigBytes)) {
            LOG.warning("Tentative d'utilisation d'un token JWT avec signature invalide !");
            return null;
        }

        // 2. Décodage et parsing du payload
        try {
            byte[] payloadBytes = Base64.getUrlDecoder().decode(payloadBase64);
            String payloadJson = new String(payloadBytes, StandardCharsets.UTF_8);

            Long exp = extractLong(payloadJson, "exp");
            if (exp == null || Instant.now().getEpochSecond() > exp) {
                LOG.info("Token JWT expiré");
                return null;
            }

            String sub = extractString(payloadJson, "sub");
            if (sub == null) return null;

            UUID userId = UUID.fromString(sub);
            String email = extractString(payloadJson, "email");
            String role = extractString(payloadJson, "role");

            return new JwtClaims(userId, email, role != null ? role : "PLAYER", exp);
        } catch (Exception e) {
            LOG.log(Level.WARNING, "Erreur lors du décodage du token JWT", e);
            return null;
        }
    }

    /**
     * Calcule la signature HMAC-SHA256 en Base64 URL-safe.
     */
    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Impossible de signer le token HMAC-SHA256", e);
        }
    }

    private static String extractString(String json, String key) {
        Pattern pattern = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"([^\"]+)\"");
        Matcher matcher = pattern.matcher(json);
        return matcher.find() ? matcher.group(1) : null;
    }

    private static Long extractLong(String json, String key) {
        Pattern pattern = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(\\d+)");
        Matcher matcher = pattern.matcher(json);
        return matcher.find() ? Long.parseLong(matcher.group(1)) : null;
    }

    private static String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String resolveSecretKey() {
        try (var in = JwtService.class.getClassLoader().getResourceAsStream("META-INF/microprofile-config.properties")) {
            if (in != null) {
                java.util.Properties props = new java.util.Properties();
                props.load(in);
                String val = props.getProperty("jwt.secret");
                if (val != null && !val.isBlank()) return val.trim();
            }
        } catch (Exception ignored) {
            // Fallback si fichier absent
        }
        String propKey = System.getProperty("jwt.secret");
        if (propKey != null && !propKey.isBlank()) {
            return propKey;
        }
        return "football-booking-secret-jwt-key-change-in-production-2026-secure-hmac-sha256";
    }
}
