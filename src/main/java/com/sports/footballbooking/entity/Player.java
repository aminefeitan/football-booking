package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

/**
 * Concrete Player entity representing registered players.
 * Absorbs sports-specific attributes previously held by PlayerProfile.
 */
@Entity
@Table(name = "players")
@DiscriminatorValue("PLAYER")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@NamedQueries({
        @NamedQuery(name = "Player.findAllAvailable",
                query = "SELECT p FROM Player p WHERE p.available = true ORDER BY p.lastName"),
        @NamedQuery(name = "Player.findAvailableByCity",
                query = "SELECT p FROM Player p WHERE p.available = true AND (:city IS NULL OR LOWER(p.city) = LOWER(:city)) ORDER BY p.lastName")
})
public class Player extends User {

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

    public Player() {
        super();
    }

    public Player(String email, String passwordHash, String firstName, String lastName) {
        super(email, passwordHash, firstName, lastName);
        this.available = true;
    }

    @Override
    public Role getRole() {
        return Role.PLAYER;
    }

    // ==================== Getters & Setters ====================

    public String getPreferredPosition() {
        return preferredPosition;
    }

    public void setPreferredPosition(String preferredPosition) {
        this.preferredPosition = preferredPosition;
    }

    public String getSkillLevel() {
        return skillLevel;
    }

    public void setSkillLevel(String skillLevel) {
        this.skillLevel = skillLevel;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}
