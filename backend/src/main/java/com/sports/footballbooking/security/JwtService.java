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

    public String generateToken(UUID userId) {
        Instant now = Instant.now();
        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(userId.toString())
                .withIssuedAt(now)
                .withExpiresAt(now.plus(8, ChronoUnit.HOURS))
                .sign(algorithm);
    }

    public Optional<UUID> validate(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            DecodedJWT jwt = verifier.verify(token);
            String sub = jwt.getSubject();
            if (sub == null || sub.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(UUID.fromString(sub));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
