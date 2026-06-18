package com.mikmok.backend.repository;

import com.mikmok.backend.entity.WatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {
    boolean existsByUserIdAndVideoId(Long userId, Long videoId);

    List<WatchHistory> findByUserId(Long userId);

    Optional<WatchHistory> findByUserIdAndVideoId(Long userId, Long videoId);
}
