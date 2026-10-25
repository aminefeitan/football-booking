package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Player profile containing sports-specific attributes and matchmaking preferences.
 */
@Entity
@Table(name = "player_profiles")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@NamedQueries({
        @NamedQuery(name = "PlayerProfile.findByUserId",
                query = "SELECT p FROM PlayerProfile p WHERE p.user.id = :userId"),
        @NamedQuery(name = "PlayerProfile.findAvailableByCity",
                query = "SELECT p FROM PlayerProfile p WHERE p.available = true AND (:city IS NULL OR LOWER(p.city) = LOWER(:city))")
})
public class PlayerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User user;

    @Size(max = 50)
    @Column(name = "preferred_position", length = 50)
    private String preferredPosition;

    @Size(max = 20)
    @Column(name = "skill_level", length = 20)
    private String skillLevel;

    @Size(max = 100)
    @Column(length = 100)
    private String city;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false)
    private boolean available = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected PlayerProfile() {
        // JPA required
    }

    public PlayerProfile(User user) {
        this.user = user;
        this.available = true;
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getPreferredPosition() { return preferredPosition; }
    public void setPreferredPosition(String preferredPosition) { this.preferredPosition = preferredPosition; }
    public String getSkillLevel() { return skillLevel; }
    public void setSkillLevel(String skillLevel) { this.skillLevel = skillLevel; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
