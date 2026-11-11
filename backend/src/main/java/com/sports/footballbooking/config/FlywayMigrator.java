package com.sports.footballbooking.config;

import jakarta.annotation.Resource;
import jakarta.annotation.sql.DataSourceDefinition;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.Initialized;
import jakarta.enterprise.event.Observes;
import org.flywaydb.core.Flyway;

import javax.sql.DataSource;
import java.util.logging.Level;
import java.util.logging.Logger;

@DataSourceDefinition(
    name = "java:jboss/datasources/FootballBookingDS",
    className = "org.postgresql.ds.PGSimpleDataSource",
    url = "jdbc:postgresql://localhost:5432/football_booking?stringtype=unspecified",
    user = "postgres",
    password = "Amine@2005"
)
@ApplicationScoped
public class FlywayMigrator {

    private static final Logger LOG = Logger.getLogger(FlywayMigrator.class.getName());

    @Resource(lookup = "java:jboss/datasources/FootballBookingDS")
    private DataSource dataSource;

    public void init(@Observes @Initialized(ApplicationScoped.class) Object init) {
        LOG.info("Starting Flyway database migration...");
        try {
            if (dataSource != null) {
                Flyway flyway = Flyway.configure()
                        .dataSource(dataSource)
                        .locations("classpath:db/migration")
                        .baselineOnMigrate(true)
                        .load();

                flyway.migrate();
                LOG.info("Flyway migration completed successfully.");
            } else {
                LOG.warning("DataSource is null, skipping Flyway migration.");
            }
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Flyway migration failed!", e);
            throw new RuntimeException("Database migration failed", e);
        }
    }
}
