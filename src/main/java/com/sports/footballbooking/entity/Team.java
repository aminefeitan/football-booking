package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a football team/club.
 */
@Entity
@Table(name = "teams")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@NamedQueries({
        @NamedQuery(name = "Team.findByCity",
                query = "SELECT t FROM Team t WHERE LOWER(t.city) = LOWER(:city) AND t.active = true ORDER BY t.name"),
        @NamedQuery(name = "Team.findAllActive",
                query = "SELECT t FROM Team t WHERE t.active = true ORDER BY t.createdAt DESC"),
        @NamedQuery(name = "Team.findByCreator",
                query = "SELECT t FROM Team t WHERE t.creator.id = :creatorId AND t.active = true ORDER BY t.createdAt DESC")
})
public class Team extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User creator;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Size(max = 100)
    @Column(length = 100)
    private String city;

    @Column(name = "max_members", nullable = false)
    private int maxMembers = 15;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeamMember> members = new ArrayList<>();

    public Team() {}

    public Team(User creator, String name, String city, int maxMembers) {
        this.creator = creator;
        this.name = name;
        this.city = city;
        this.maxMembers = maxMembers > 0 ? maxMembers : 15;
        this.active = true;
    }

    // Getters and Setters
    public User getCreator() { return creator; }
    public void setCreator(User creator) { this.creator = creator; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public int getMaxMembers() { return maxMembers; }
    public void setMaxMembers(int maxMembers) { this.maxMembers = maxMembers; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public List<TeamMember> getMembers() { return members; }
    public void setMembers(List<TeamMember> members) { this.members = members; }
}
