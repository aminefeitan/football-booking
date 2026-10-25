package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents a football pitch/field.
 * Contains football-specific characteristics like field format (5v5, 7v7, 11v11),
 * surface type, lighting, locker rooms, and parking.
 */
@Entity
@Table(name = "fields")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@NamedQueries({
        @NamedQuery(name = "Field.findAllActive",
                query = "SELECT f FROM Field f WHERE f.active = true ORDER BY f.name"),
        @NamedQuery(name = "Field.findByCity",
                query = "SELECT f FROM Field f WHERE LOWER(f.city) = LOWER(:city) AND f.active = true ORDER BY f.name"),
        @NamedQuery(name = "Field.findByFieldType",
                query = "SELECT f FROM Field f WHERE f.fieldType = :fieldType AND f.active = true ORDER BY f.name"),
        @NamedQuery(name = "Field.findByOwner",
                query = "SELECT f FROM Field f WHERE f.owner.id = :ownerId AND f.active = true ORDER BY f.createdAt DESC")
})
public class Field {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User owner;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Size(max = 500)
    @Column(length = 500)
    private String address;

    @Size(max = 100)
    @Column(length = 100)
    private String city;

    @Size(max = 20)
    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Size(max = 20)
    @Column(length = 20)
    private String phone;

    @NotBlank
    @Size(max = 10)
    @Column(name = "field_type", nullable = false, length = 10)
    private String fieldType = "5v5"; // 5v5, 7v7, 11v11

    @Size(max = 50)
    @Column(name = "surface_type", length = 50)
    private String surfaceType; // Synthétique, Gazon naturel, Hybride

    @Column
    private Integer capacity;

    @NotNull
    @Positive
    @Column(name = "price_per_hour", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerHour;

    @NotBlank
    @Size(max = 3)
    @Column(nullable = false, length = 3)
    private String currency = "MAD";

    @Column(nullable = false)
    private boolean indoor = false;

    @Column(name = "has_lights", nullable = false)
    private boolean hasLights = false;

    @Column(name = "has_locker_room", nullable = false)
    private boolean hasLockerRoom = false;

    @Column(name = "has_parking", nullable = false)
    private boolean hasParking = false;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Field() {
        // Required by JPA
    }

    public Field(String name, String city, String fieldType, BigDecimal pricePerHour) {
        this.name = name;
        this.city = city;
        this.fieldType = fieldType != null ? fieldType : "5v5";
        this.pricePerHour = pricePerHour;
        this.currency = "MAD";
        this.active = true;
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

    // ==================== Getters ====================

    public UUID getId() { return id; }
    public User getOwner() { return owner; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getAddress() { return address; }
    public String getCity() { return city; }
    public String getPostalCode() { return postalCode; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public String getPhone() { return phone; }
    public String getFieldType() { return fieldType; }
    public String getSurfaceType() { return surfaceType; }
    public Integer getCapacity() { return capacity; }
    public BigDecimal getPricePerHour() { return pricePerHour; }
    public String getCurrency() { return currency; }
    public boolean isIndoor() { return indoor; }
    public boolean isHasLights() { return hasLights; }
    public boolean isHasLockerRoom() { return hasLockerRoom; }
    public boolean isHasParking() { return hasParking; }
    public boolean isActive() { return active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    // ==================== Setters ====================

    public void setId(UUID id) { this.id = id; }
    public void setOwner(User owner) { this.owner = owner; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setAddress(String address) { this.address = address; }
    public void setCity(String city) { this.city = city; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setFieldType(String fieldType) { this.fieldType = fieldType; }
    public void setSurfaceType(String surfaceType) { this.surfaceType = surfaceType; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public void setPricePerHour(BigDecimal pricePerHour) { this.pricePerHour = pricePerHour; }
    public void setCurrency(String currency) { this.currency = currency; }
    public void setIndoor(boolean indoor) { this.indoor = indoor; }
    public void setHasLights(boolean hasLights) { this.hasLights = hasLights; }
    public void setHasLockerRoom(boolean hasLockerRoom) { this.hasLockerRoom = hasLockerRoom; }
    public void setHasParking(boolean hasParking) { this.hasParking = hasParking; }
    public void setActive(boolean active) { this.active = active; }
}
