package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;

/**
 * Concrete entity representing a system administrator.
 */
@Entity
@Table(name = "admins")
@DiscriminatorValue("ADMIN")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Admin extends User {

    @Size(max = 100)
    @Column(length = 100)
    private String department;

    public Admin() {
        super();
    }

    public Admin(String email, String passwordHash, String firstName, String lastName) {
        super(email, passwordHash, firstName, lastName);
    }

    @Override
    public Role getRole() {
        return Role.ADMIN;
    }

    // ==================== Getters & Setters ====================

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}
