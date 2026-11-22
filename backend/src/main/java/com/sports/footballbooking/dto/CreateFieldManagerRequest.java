package com.sports.footballbooking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFieldManagerRequest(
        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format d'email invalide")
        String email,

        @NotBlank(message = "Le prénom est obligatoire")
        @Size(max = 100, message = "Le prénom ne doit pas dépasser 100 caractères")
        String firstName,

        @NotBlank(message = "Le nom est obligatoire")
        @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères")
        String lastName,

        @Size(max = 20, message = "Le téléphone ne doit pas dépasser 20 caractères")
        String phone
) {
}
