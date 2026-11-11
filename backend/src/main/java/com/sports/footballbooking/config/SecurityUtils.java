package com.sports.footballbooking.config;

import jakarta.ws.rs.core.SecurityContext;
import java.util.UUID;

/**
 * Utilitaires pour extraire l'utilisateur courant depuis le SecurityContext JAX-RS.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Récupère l'UUID de l'utilisateur authentifié depuis le SecurityContext.
     */
    public static UUID getUserId(SecurityContext securityContext) {
        if (securityContext == null || securityContext.getUserPrincipal() == null) {
            return null;
        }
        return UUID.fromString(securityContext.getUserPrincipal().getName());
    }
}

