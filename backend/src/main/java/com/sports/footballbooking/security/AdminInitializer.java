package com.sports.footballbooking.security;

import jakarta.annotation.PostConstruct;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.inject.Inject;

@Singleton
@Startup
public class AdminInitializer {

    @Inject
    private AdminBootstrapService adminBootstrapService;

    @PostConstruct
    public void init() {
        adminBootstrapService.ensureAdmin();
    }
}
