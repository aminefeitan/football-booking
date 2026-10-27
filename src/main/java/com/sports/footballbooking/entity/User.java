package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Abstract root entity representing a registered user of the application.
 * Uses JPA JOINED table inheritance strategy with role-based discriminator.
 */
@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "role", discriminatorType = DiscriminatorType.STRING)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "role",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = Player.class, name = "PLAYER"),
        @JsonSubTypes.Type(value = FieldManager.class, name = "FIELD_MANAGER"),
        @JsonSubTypes.Type(value = Admin.class, name = "ADMIN")
})
@NamedQueries({
        @NamedQuery(name = "User.findByEmail",
                query = "SELECT u FROM User u WHERE u.email = :email"),
        @NamedQuery(name = "User.findByRole",
                query = "SELECT u FROM User u WHERE u.role = :role")
})
public abstract class User extends BaseEntity {

    public enum Role {
        PLAYER,
        FIELD_MANAGER,
        ADMIN
    }

    public enum Status {
        ACTIVE,
        INACTIVE,
        SUSPENDED,
        BANNED
    }

    @NotBlank
    @Email
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @JsonIgnore
    @NotBlank
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @NotBlank
    @Size(max = 100)
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Size(max = 20)
    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", insertable = false, updatable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    protected User() {
        // Required by JPA
    }

    public User(String email, String passwordHash, String firstName, String lastName) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
        this.status = Status.ACTIVE;
    }

    /**
     * Polymorphic role getter implemented by each concrete subclass.
     */
    public abstract Role getRole();

    // ==================== Getters & Setters ====================

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
