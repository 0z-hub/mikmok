package com.mikmok.backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AdminServiceTest {

    @Test
    void formatStatPath_getMethod_returnsPathOnly() {
        assertEquals("/api/videos/recommend", AdminService.formatStatPath("/api/videos/recommend", "GET"));
    }

    @Test
    void formatStatPath_postMethod_appendsMethod() {
        assertEquals("/api/my/videos (POST)", AdminService.formatStatPath("/api/my/videos", "POST"));
    }
}
