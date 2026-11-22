package com.sports.footballbooking.security;

import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;
import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

@Provider
@ApplicationScoped
@Priority(Priorities.AUTHENTICATION)
public class AuthFilter implements ContainerRequestFilter {

    @Inject
    private JwtService jwtService;

    @Inject
    private UserRepository userRepository;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String method = requestContext.getMethod();
        String path = requestContext.getUriInfo().getPath();

        if (isPublic(method, path)) {
            return;
        }

        String authHeader = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new NotAuthorizedException("Bearer");
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            throw new NotAuthorizedException("Bearer");
        }

        Optional<UUID> userIdOpt = jwtService.validate(token);
        if (userIdOpt.isEmpty()) {
            throw new NotAuthorizedException("Bearer");
        }

        UUID userId = userIdOpt.get();

        // Rôle et statut relus en base à chaque requête
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotAuthorizedException("Bearer"));

        if (user.getStatus() != User.Status.ACTIVE) {
            throw new ForbiddenException("Ce compte est " + user.getStatus().name().toLowerCase());
        }

        // Forced password change verification
        if (user.isMustChangePassword()) {
            String normalized = normalizePath(path);
            boolean isGetMe = "GET".equalsIgnoreCase(method) && "users/me".equalsIgnoreCase(normalized);
            boolean isPutPassword = "PUT".equalsIgnoreCase(method) && "users/me/password".equalsIgnoreCase(normalized);
            if (!isGetMe && !isPutPassword) {
                throw new ForbiddenException("Password change required");
            }
        }

        SecurityContext originalContext = requestContext.getSecurityContext();
        boolean isSecure = originalContext != null && originalContext.isSecure();

        final String roleName = user.getRole().name();

        requestContext.setSecurityContext(new SecurityContext() {
            @Override
            public Principal getUserPrincipal() {
                return () -> userId.toString();
            }

            @Override
            public boolean isUserInRole(String role) {
                return roleName.equalsIgnoreCase(role);
            }

            @Override
            public boolean isSecure() {
                return isSecure;
            }

            @Override
            public String getAuthenticationScheme() {
                return "Bearer";
            }
        });
    }

    private boolean isPublic(String method, String path) {
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }
        String normalized = normalizePath(path);
        if ("POST".equalsIgnoreCase(method)) {
            return "auth/login".equalsIgnoreCase(normalized) || "auth/register".equalsIgnoreCase(normalized);
        }
        return false;
    }

    private String normalizePath(String path) {
        String normalized = path == null ? "" : path.trim();
        if (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.startsWith("api/v1/")) {
            normalized = normalized.substring(7);
        }
        return normalized;
    }
}
