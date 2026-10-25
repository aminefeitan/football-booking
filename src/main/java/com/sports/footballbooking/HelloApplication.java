package com.sports.footballbooking;

import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

/**
 * JAX-RS Application configuration.
 * All REST endpoints are served under /api/v1/
 */
@ApplicationPath("/api/v1")
public class HelloApplication extends Application {

}