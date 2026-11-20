package com.sports.footballbooking.security;

import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Provider
@PreMatching
@ApplicationScoped
@Priority(Priorities.AUTHENTICATION - 100)
public class CorsFilter implements ContainerRequestFilter, ContainerResponseFilter {

    private static final String ALLOWED_HEADERS = "Origin, Content-Type, Accept, Authorization";
    private static final String ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD";
    private static final String MAX_AGE = "3600";

    @Inject
    @ConfigProperty(name = "cors.allowed.origins", defaultValue = "http://localhost:3000")
    private String allowedOriginsConfig;

    private Set<String> getAllowedOrigins() {
        if (allowedOriginsConfig == null || allowedOriginsConfig.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(allowedOriginsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    private boolean isAllowedOrigin(String origin) {
        if (origin == null || origin.isBlank()) {
            return false;
        }
        return getAllowedOrigins().contains(origin);
    }

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())) {
            Response.ResponseBuilder builder = Response.ok();
            String origin = requestContext.getHeaderString("Origin");
            if (isAllowedOrigin(origin)) {
                builder.header("Access-Control-Allow-Origin", origin);
                builder.header("Access-Control-Allow-Credentials", "true");
                builder.header("Vary", "Origin");
            }
            builder.header("Access-Control-Allow-Headers", ALLOWED_HEADERS);
            builder.header("Access-Control-Allow-Methods", ALLOWED_METHODS);
            builder.header("Access-Control-Max-Age", MAX_AGE);
            requestContext.abortWith(builder.build());
        }
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) throws IOException {
        String origin = requestContext.getHeaderString("Origin");
        if (isAllowedOrigin(origin)) {
            responseContext.getHeaders().putSingle("Access-Control-Allow-Origin", origin);
            responseContext.getHeaders().putSingle("Access-Control-Allow-Credentials", "true");
            responseContext.getHeaders().putSingle("Vary", "Origin");
        }
        responseContext.getHeaders().putSingle("Access-Control-Allow-Headers", ALLOWED_HEADERS);
        responseContext.getHeaders().putSingle("Access-Control-Allow-Methods", ALLOWED_METHODS);
        responseContext.getHeaders().putSingle("Access-Control-Max-Age", MAX_AGE);
    }
}
