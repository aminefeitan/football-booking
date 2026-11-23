package com.sports.footballbooking.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class PhotoStorageService {

    public static final int MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

    @Inject
    @ConfigProperty(name = "app.upload.dir")
    private Optional<String> uploadDirConfig;

    private Path uploadDir;

    @PostConstruct
    void init() {
        String dir = uploadDirConfig
                .or(() -> Optional.ofNullable(System.getenv("UPLOAD_DIR")))
                .or(() -> Optional.ofNullable(System.getProperty("app.upload.dir")))
                .orElseGet(() -> Paths.get(System.getProperty("user.home"), ".football-booking", "uploads").toString());

        try {
            uploadDir = Paths.get(dir.trim()).toAbsolutePath().normalize();
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize upload directory: " + dir, e);
        }
    }

    public String savePhoto(InputStream is) {
        if (is == null) {
            throw new BadRequestException("Aucun fichier fourni");
        }

        byte[] data;
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            int total = 0;
            while ((read = is.read(buffer)) != -1) {
                total += read;
                if (total > MAX_FILE_SIZE) {
                    throw new BadRequestException("Le fichier dépasse la taille maximale autorisée de 2 Mo");
                }
                baos.write(buffer, 0, read);
            }
            data = baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier", e);
        }

        if (data.length < 12) {
            throw new BadRequestException("Format de fichier invalide");
        }

        String extension = detectImageExtension(data);
        String filename = UUID.randomUUID() + extension;

        Path target = uploadDir.resolve(filename).normalize();
        if (!target.startsWith(uploadDir)) {
            throw new BadRequestException("Chemin de destination invalide");
        }

        try {
            Files.write(target, data);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement de l'image", e);
        }

        return filename;
    }

    public byte[] loadPhoto(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }

        Path target = uploadDir.resolve(filename).normalize();
        if (!target.startsWith(uploadDir) || !Files.exists(target)) {
            return null;
        }

        try {
            return Files.readAllBytes(target);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier photo", e);
        }
    }

    public void deletePhoto(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }

        Path target = uploadDir.resolve(filename).normalize();
        if (target.startsWith(uploadDir) && Files.exists(target)) {
            try {
                Files.delete(target);
            } catch (IOException ignored) {
            }
        }
    }

    public String getContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "application/octet-stream";
    }

    public static String detectImageExtension(byte[] data) {
        if (data.length >= 3 &&
                (data[0] & 0xFF) == 0xFF &&
                (data[1] & 0xFF) == 0xD8 &&
                (data[2] & 0xFF) == 0xFF) {
            return ".jpg";
        }

        if (data.length >= 8 &&
                (data[0] & 0xFF) == 0x89 &&
                data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47 &&
                data[4] == 0x0D && data[5] == 0x0A && data[6] == 0x1A && data[7] == 0x0A) {
            return ".png";
        }

        if (data.length >= 12 &&
                data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F' &&
                data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') {
            return ".webp";
        }

        throw new BadRequestException("Format d'image non supporté (JPEG, PNG ou WebP uniquement)");
    }
}
