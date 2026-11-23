package com.sports.footballbooking.service;

import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class PhotoStorageServiceTest {

    private PhotoStorageService photoStorageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() throws Exception {
        photoStorageService = new PhotoStorageService();
        Field configField = PhotoStorageService.class.getDeclaredField("uploadDirConfig");
        configField.setAccessible(true);
        configField.set(photoStorageService, Optional.of(tempDir.toString()));
        photoStorageService.init();
    }

    @Test
    @DisplayName("Fallback automatique sur le répertoire par défaut sans variable d'environnement")
    void testInitFallbackDefaultDirectory() throws Exception {
        PhotoStorageService fallbackService = new PhotoStorageService();
        Field configField = PhotoStorageService.class.getDeclaredField("uploadDirConfig");
        configField.setAccessible(true);
        configField.set(fallbackService, Optional.empty());

        assertDoesNotThrow(fallbackService::init);
    }

    @Test
    @DisplayName("Section E : Enregistrement réussi d'une image JPEG valide (magic bytes FF D8 FF)")
    void testSaveValidJpeg() {
        byte[] jpegBytes = new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
                0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01
        };
        InputStream is = new ByteArrayInputStream(jpegBytes);

        String filename = photoStorageService.savePhoto(is);

        assertNotNull(filename);
        assertTrue(filename.endsWith(".jpg"));

        byte[] loaded = photoStorageService.loadPhoto(filename);
        assertNotNull(loaded);
        assertEquals(jpegBytes.length, loaded.length);
        assertEquals("image/jpeg", photoStorageService.getContentType(filename));
    }

    @Test
    @DisplayName("Section E : Enregistrement réussi d'une image PNG valide (magic bytes 89 50 4E 47 0D 0A 1A 0A)")
    void testSaveValidPng() {
        byte[] pngBytes = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
        };
        InputStream is = new ByteArrayInputStream(pngBytes);

        String filename = photoStorageService.savePhoto(is);

        assertNotNull(filename);
        assertTrue(filename.endsWith(".png"));

        byte[] loaded = photoStorageService.loadPhoto(filename);
        assertNotNull(loaded);
        assertEquals("image/png", photoStorageService.getContentType(filename));
    }

    @Test
    @DisplayName("Section E : Enregistrement réussi d'une image WebP valide (RIFF....WEBP)")
    void testSaveValidWebp() {
        byte[] webpBytes = new byte[]{
                'R', 'I', 'F', 'F',
                0x24, 0x00, 0x00, 0x00,
                'W', 'E', 'B', 'P',
                'V', 'P', '8', ' '
        };
        InputStream is = new ByteArrayInputStream(webpBytes);

        String filename = photoStorageService.savePhoto(is);

        assertNotNull(filename);
        assertTrue(filename.endsWith(".webp"));

        byte[] loaded = photoStorageService.loadPhoto(filename);
        assertNotNull(loaded);
        assertEquals("image/webp", photoStorageService.getContentType(filename));
    }

    @Test
    @DisplayName("Section E : Rejet des fichiers non conformes (SVG, GIF, script, mauvais magic bytes) -> 400 BadRequestException")
    void testRejectInvalidFormats() {
        // SVG ou script XML
        byte[] svgBytes = "<svg xmlns='http://www.w3.org/2000/svg'></svg>".getBytes();
        assertThrows(BadRequestException.class, () -> photoStorageService.savePhoto(new ByteArrayInputStream(svgBytes)));

        // GIF
        byte[] gifBytes = "GIF89a1234567890".getBytes();
        assertThrows(BadRequestException.class, () -> photoStorageService.savePhoto(new ByteArrayInputStream(gifBytes)));

        // Faux JPEG
        byte[] fakeJpg = "THIS IS NOT A VALID JPEG IMAGE DATA".getBytes();
        assertThrows(BadRequestException.class, () -> photoStorageService.savePhoto(new ByteArrayInputStream(fakeJpg)));
    }

    @Test
    @DisplayName("Section E : Rejet des fichiers dépassant 2 Mo -> 400 BadRequestException")
    void testRejectFileExceeding2Mb() {
        // 2 Mo + 1 octet
        byte[] largeBytes = new byte[2 * 1024 * 1024 + 1];
        largeBytes[0] = (byte) 0xFF;
        largeBytes[1] = (byte) 0xD8;
        largeBytes[2] = (byte) 0xFF;

        assertThrows(BadRequestException.class, () -> photoStorageService.savePhoto(new ByteArrayInputStream(largeBytes)));
    }

    @Test
    @DisplayName("Section E : Suppression de photo et chargement d'un fichier inexistant")
    void testDeleteAndMissingPhoto() {
        assertNull(photoStorageService.loadPhoto("non-existent-photo.jpg"));

        // Suppression d'un fichier inexistant ne doit pas lever d'erreur
        assertDoesNotThrow(() -> photoStorageService.deletePhoto("non-existent-photo.jpg"));
    }
}
