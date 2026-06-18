package com.mikmok.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSchemaInitializer {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void migrate() {
        try {
            jdbcTemplate.execute("""
                    ALTER TABLE users
                    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER'
                    """);
            log.info("Database schema check: users.role column ensured");
        } catch (Exception e) {
            log.error("Failed to migrate users.role column", e);
        }

        try {
            jdbcTemplate.execute("""
                    ALTER TABLE videos
                    ADD COLUMN IF NOT EXISTS description VARCHAR(255)
                    """);
            log.info("Database schema check: videos.description column ensured");
        } catch (Exception e) {
            log.error("Failed to migrate videos.description column", e);
        }
    }
}
