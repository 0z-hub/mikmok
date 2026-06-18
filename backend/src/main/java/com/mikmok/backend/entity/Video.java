package com.mikmok.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "videos", indexes = {@Index(name = "idx_video_md5", columnList = "md5")})
@Data
public class Video {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String videoUrl;

    @Column(nullable = false, length = 32)
    private String md5;

    private Long fileSize;

    private String contentType;

    @Column(nullable = false)
    private Integer likeCount = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
