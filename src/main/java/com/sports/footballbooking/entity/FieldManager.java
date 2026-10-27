package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete entity representing a field manager / complex owner.
 * Manages one or more football fields.
 */
@Entity
@Table(name = "field_managers")
@DiscriminatorValue("FIELD_MANAGER")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FieldManager extends User {

    @Size(max = 200)
    @Column(name = "business_name", length = 200)
    private String businessName;

    @Size(max = 100)
    @Column(name = "tax_number", length = 100)
    private String taxNumber;

    @JsonIgnore
    @OneToMany(mappedBy = "owner", fetch = FetchType.LAZY)
    private List<Field> managedFields = new ArrayList<>();

    public FieldManager() {
        super();
    }

    public FieldManager(String email, String passwordHash, String firstName, String lastName) {
        super(email, passwordHash, firstName, lastName);
    }

    @Override
    public Role getRole() {
        return Role.FIELD_MANAGER;
    }

    // ==================== Getters & Setters ====================

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getTaxNumber() {
        return taxNumber;
    }

    public void setTaxNumber(String taxNumber) {
        this.taxNumber = taxNumber;
    }

    public List<Field> getManagedFields() {
        return managedFields;
    }

    public void setManagedFields(List<Field> managedFields) {
        this.managedFields = managedFields;
    }
}
