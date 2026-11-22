package com.sports.footballbooking.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalTime;

@Entity
@Table(name = "fields")
public class Field extends BaseEntity {

    public enum FieldStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(length = 20)
    private String phone;

    @Column(name = "field_type", nullable = false, length = 10)
    private String fieldType;

    @Column(name = "surface_type", length = 50)
    private String surfaceType;

    private Integer capacity;

    @Column(name = "price_per_hour", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerHour;

    @Column(nullable = false, length = 3)
    private String currency = "MAD";

    @Column(nullable = false)
    private boolean indoor = false;

    @Column(name = "has_lights", nullable = false)
    private boolean hasLights = true;

    @Column(name = "has_locker_room", nullable = false)
    private boolean hasLockerRoom = true;

    @Column(name = "has_parking", nullable = false)
    private boolean hasParking = true;

    @Column(name = "open_time", nullable = false)
    private LocalTime openTime;

    @Column(name = "close_time", nullable = false)
    private LocalTime closeTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FieldStatus status = FieldStatus.PENDING;

    @Column(name = "photo_filename", length = 100)
    private String photoFilename;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    public Field() {
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getFieldType() {
        return fieldType;
    }

    public void setFieldType(String fieldType) {
        this.fieldType = fieldType;
    }

    public String getSurfaceType() {
        return surfaceType;
    }

    public void setSurfaceType(String surfaceType) {
        this.surfaceType = surfaceType;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public BigDecimal getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(BigDecimal pricePerHour) {
        this.pricePerHour = pricePerHour;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public boolean isIndoor() {
        return indoor;
    }

    public void setIndoor(boolean indoor) {
        this.indoor = indoor;
    }

    public boolean isHasLights() {
        return hasLights;
    }

    public void setHasLights(boolean hasLights) {
        this.hasLights = hasLights;
    }

    public boolean isHasLockerRoom() {
        return hasLockerRoom;
    }

    public void setHasLockerRoom(boolean hasLockerRoom) {
        this.hasLockerRoom = hasLockerRoom;
    }

    public boolean isHasParking() {
        return hasParking;
    }

    public void setHasParking(boolean hasParking) {
        this.hasParking = hasParking;
    }

    public LocalTime getOpenTime() {
        return openTime;
    }

    public void setOpenTime(LocalTime openTime) {
        this.openTime = openTime;
    }

    public LocalTime getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(LocalTime closeTime) {
        this.closeTime = closeTime;
    }

    public FieldStatus getStatus() {
        return status;
    }

    public void setStatus(FieldStatus status) {
        this.status = status;
    }

    public String getPhotoFilename() {
        return photoFilename;
    }

    public void setPhotoFilename(String photoFilename) {
        this.photoFilename = photoFilename;
    }

    public User getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(User reviewedBy) {
        this.reviewedBy = reviewedBy;
    }
}
