package com.mikmok.backend.repository;

import com.mikmok.backend.entity.WatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {
    boolean existsByUserIdAndVideoId(Long userId, Long videoId);
}
