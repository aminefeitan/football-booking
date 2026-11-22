package com.sports.footballbooking.security;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

@ApplicationScoped
public class AdminBootstrapService {

    private static final Logger LOG = Logger.getLogger(AdminBootstrapService.class.getName());
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    @Inject
    private UserRepository userRepository;

    @Inject
    @ConfigProperty(name = "admin.email")
    private Optional<String> adminEmailConfig;

    @Inject
    @ConfigProperty(name = "admin.password")
    private Optional<String> adminPasswordConfig;

    @Inject
    @ConfigProperty(name = "admin.first.name")
    private Optional<String> adminFirstNameConfig;

    @Inject
    @ConfigProperty(name = "admin.last.name")
    private Optional<String> adminLastNameConfig;

    @Transactional
    public void ensureAdmin() {
        if (userRepository.existsByRole(User.Role.ADMIN)) {
            return;
        }

        String email = adminEmailConfig
                .or(() -> Optional.ofNullable(System.getenv("ADMIN_EMAIL")))
                .or(() -> Optional.ofNullable(System.getProperty("admin.email")))
                .map(String::trim)
                .map(String::toLowerCase)
                .orElse("admin@footbook.ma");

        String password = adminPasswordConfig
                .or(() -> Optional.ofNullable(System.getenv("ADMIN_PASSWORD")))
                .or(() -> Optional.ofNullable(System.getProperty("admin.password")))
                .orElse("footbook123");

        if (email.isBlank() || !EMAIL_PATTERN.matcher(email).matches() ||
                password.length() < 8 || password.length() > 72) {
            throw new IllegalStateException("Invalid admin credentials: email=" + email + " (password 8-72 chars)");
        }

        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            if (existing.get().getRole() == User.Role.ADMIN) {
                return;
            }
            throw new IllegalStateException("User with email " + email + " already exists with another role");
        }

        String firstName = adminFirstNameConfig
                .or(() -> Optional.ofNullable(System.getenv("ADMIN_FIRST_NAME")))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .orElse("Admin");

        String lastName = adminLastNameConfig
                .or(() -> Optional.ofNullable(System.getenv("ADMIN_LAST_NAME")))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .orElse("Administrator");

        String passwordHash = BCrypt.withDefaults().hashToString(12, password.toCharArray());

        User admin = new User(
                email,
                passwordHash,
                firstName,
                lastName,
                null,
                User.Role.ADMIN
        );
        admin.setStatus(User.Status.ACTIVE);
        admin.setMustChangePassword(false);

        try {
            userRepository.persist(admin);
            LOG.info("Initial admin account created: " + email);
        } catch (Exception e) {
            LOG.log(Level.INFO, "Admin account already created by concurrent startup: " + email);
        }
    }
}
