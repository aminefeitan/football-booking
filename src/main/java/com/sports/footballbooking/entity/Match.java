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
 * Represents a football match (friendly, pickup, or team vs team match).
 */
@Entity
@Table(name = "matches")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@NamedQueries({
        @NamedQuery(name = "Match.findPublicUpcoming",
                query = "SELECT m FROM Match m WHERE m.isPublic = true AND m.matchDate >= :now ORDER BY m.matchDate ASC"),
        @NamedQuery(name = "Match.findByOrganizer",
                query = "SELECT m FROM Match m WHERE m.organizer.id = :organizerId ORDER BY m.matchDate DESC"),
        @NamedQuery(name = "Match.findByCity",
                query = "SELECT m FROM Match m WHERE m.isPublic = true AND LOWER(m.city) = LOWER(:city) AND m.matchDate >= :now ORDER BY m.matchDate ASC")
})
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "organizer_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User organizer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "booking_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Booking booking;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "field_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Field field;

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(name = "match_date", nullable = false)
    private OffsetDateTime matchDate;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes = 60;

    @Column(name = "max_players")
    private Integer maxPlayers = 10; // e.g. 10 for 5v5, 14 for 7v7, 22 for 11v11

    @Size(max = 20)
    @Column(nullable = false, length = 20)
    private String status = "OPEN"; // OPEN, FULL, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = true;

    @Size(max = 100)
    @Column(length = 100)
    private String city;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MatchParticipant> participants = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Match() {}

    public Match(User organizer, String title, OffsetDateTime matchDate, int durationMinutes) {
        this.organizer = organizer;
        this.title = title;
        this.matchDate = matchDate;
        this.durationMinutes = durationMinutes > 0 ? durationMinutes : 60;
        this.status = "OPEN";
        this.isPublic = true;
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
    public User getOrganizer() { return organizer; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }
    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }
    public Field getField() { return field; }
    public void setField(Field field) { this.field = field; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public OffsetDateTime getMatchDate() { return matchDate; }
    public void setMatchDate(OffsetDateTime matchDate) { this.matchDate = matchDate; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public Integer getMaxPlayers() { return maxPlayers; }
    public void setMaxPlayers(Integer maxPlayers) { this.maxPlayers = maxPlayers; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public List<MatchParticipant> getParticipants() { return participants; }
    public void setParticipants(List<MatchParticipant> participants) { this.participants = participants; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
