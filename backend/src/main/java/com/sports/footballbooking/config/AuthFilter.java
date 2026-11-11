package com.sports.footballbooking.config;

import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.service.AuthService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;
import java.security.Principal;
import java.util.UUID;

/**
 * Filtre JAX-RS intercepetant les requêtes annotées avec @Authenticated.
 * Supporte le standard "Authorization: Bearer <token>" ainsi que "X-User-Id"
 * pour compatibilité avec le frontend existant.
 */
@Provider
@Authenticated
@Priority(Priorities.AUTHENTICATION)
public class AuthFilter implements ContainerRequestFilter {

    @Inject
    private AuthService authService;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String authHeader = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);
        String xUserId = requestContext.getHeaderString("X-User-Id");

        UUID userId = null;

        // 1. Priorité au header standard Bearer
        if (authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = authHeader.substring(7).trim();
            userId = authService.resolveUserIdFromToken(token);
        }

        // 2. Fallback sur le header X-User-Id (utilisé par le frontend existant)
        if (userId == null && xUserId != null && !xUserId.isBlank()) {
            try {
                userId = UUID.fromString(xUserId.trim());
            } catch (IllegalArgumentException ignored) {
                // Ignore format d'UUID invalide
            }
        }

        if (userId == null) {
            abortUnauthorized(requestContext, "Authentification requise (token Bearer ou X-User-Id manquant)");
            return;
        }

        User user;
        try {
            user = authService.getUserById(userId);
        } catch (Exception e) {
            abortUnauthorized(requestContext, "Utilisateur introuvable");
            return;
        }

        if (user.getStatus() == User.Status.BANNED) {
            abortUnauthorized(requestContext, "Ce compte utilisateur est suspendu");
            return;
        }

        final UUID effectiveUserId = userId;
        final User effectiveUser = user;

        requestContext.setSecurityContext(new SecurityContext() {
            @Override
            public Principal getUserPrincipal() {
                return () -> effectiveUserId.toString();
            }

            @Override
            public boolean isUserInRole(String role) {
                return effectiveUser.getRole() != null &&
                        effectiveUser.getRole().name().equalsIgnoreCase(role);
            }

            @Override
            public boolean isSecure() {
                return requestContext.getSecurityContext() != null &&
                        requestContext.getSecurityContext().isSecure();
            }

            @Override
            public String getAuthenticationScheme() {
                return "Bearer";
            }
        });
    }

    private void abortUnauthorized(ContainerRequestContext ctx, String message) {
        String json = String.format("{\"status\":401,\"error\":\"UNAUTHORIZED\",\"message\":\"%s\"}", message);
        ctx.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                .type(MediaType.APPLICATION_JSON)
                .entity(json)
                .build());
    }
}

