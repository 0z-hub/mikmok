package com.mikmok.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "watch_history", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "video_id"})
})
@Data
public class WatchHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "video_id", nullable = false)
    private Long videoId;

    @Column(name = "is_liked", nullable = false)
    private Boolean isLiked = false;

    @Column(name = "watched_at", nullable = false)
    private LocalDateTime watchedAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
