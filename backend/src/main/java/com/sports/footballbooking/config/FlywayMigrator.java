package com.sports.footballbooking.config;

import com.sports.footballbooking.security.AdminBootstrapService;
import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.Initialized;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.flywaydb.core.Flyway;

import javax.sql.DataSource;
import java.util.logging.Level;
import java.util.logging.Logger;

@ApplicationScoped
public class FlywayMigrator {

    private static final Logger LOG = Logger.getLogger(FlywayMigrator.class.getName());

    @Resource(lookup = "java:jboss/datasources/FootballBookingDS")
    private DataSource dataSource;

    @Inject
    private AdminBootstrapService adminBootstrapService;

    public void init(@Observes @Initialized(ApplicationScoped.class) Object init) {
        LOG.info("Starting Flyway database migration...");
        try {
            if (dataSource != null) {
                Flyway flyway = Flyway.configure()
                        .dataSource(dataSource)
                        .locations("classpath:db/migration")
                        .baselineOnMigrate(true)
                        .cleanDisabled(false)
                        .load();

                try {
                    flyway.validate();
                } catch (Exception e) {
                    LOG.warning("Flyway validation failed (schema changed). Cleaning database to reapply new V1 schema...");
                    flyway.clean();
                }

                flyway.migrate();
                LOG.info("Flyway migration completed successfully.");

                if (adminBootstrapService != null) {
                    try {
                        adminBootstrapService.ensureAdmin();
                    } catch (Exception ex) {
                        LOG.log(Level.WARNING, "Admin bootstrap check after Flyway migration: " + ex.getMessage());
                    }
                }
            } else {
                LOG.warning("DataSource is null, skipping Flyway migration.");
            }
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Flyway migration failed!", e);
            throw new RuntimeException("Database migration failed", e);
        }
    }
}

