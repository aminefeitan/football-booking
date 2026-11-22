package com.sports.footballbooking.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class JwtService {

    private static final String ISSUER = "football-booking";

    @Inject
    @ConfigProperty(name = "jwt.secret")
    private Optional<String> jwtSecretConfig;

    private Algorithm algorithm;
    private JWTVerifier verifier;

    @PostConstruct
    void init() {
        if (jwtSecretConfig.isEmpty() || jwtSecretConfig.get().trim().length() < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET is missing or less than 32 characters. Application cannot start."
            );
        }
        this.algorithm = Algorithm.HMAC256(jwtSecretConfig.get().trim());
        this.verifier = JWT.require(algorithm).withIssuer(ISSUER).build();
    }

    public record UserPrincipalData(UUID userId, String role, String status, String email) {}

    public String generateToken(UUID userId, String role, String status, String email) {
        Instant now = Instant.now();
        var builder = JWT.create()
                .withIssuer(ISSUER)
                .withSubject(userId.toString())
                .withIssuedAt(now)
                .withExpiresAt(now.plus(8, ChronoUnit.HOURS));
        if (role != null) builder.withClaim("role", role);
        if (status != null) builder.withClaim("status", status);
        if (email != null) builder.withClaim("email", email);
        return builder.sign(algorithm);
    }

    public String generateToken(UUID userId) {
        return generateToken(userId, null, null, null);
    }

    public Optional<UserPrincipalData> parseToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            DecodedJWT jwt = verifier.verify(token);
            String sub = jwt.getSubject();
            if (sub == null || sub.isBlank()) {
                return Optional.empty();
            }
            UUID userId = UUID.fromString(sub);
            String role = jwt.getClaim("role").isNull() ? null : jwt.getClaim("role").asString();
            String status = jwt.getClaim("status").isNull() ? null : jwt.getClaim("status").asString();
            String email = jwt.getClaim("email").isNull() ? null : jwt.getClaim("email").asString();
            return Optional.of(new UserPrincipalData(userId, role, status, email));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Optional<UUID> validate(String token) {
        return parseToken(token).map(UserPrincipalData::userId);
    }
}
