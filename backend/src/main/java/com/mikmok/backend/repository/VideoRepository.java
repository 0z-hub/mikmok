package com.mikmok.backend.repository;

import com.mikmok.backend.entity.Video;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VideoRepository extends JpaRepository<Video, Long> {
    Page<Video> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Video> findFirstByMd5(String md5);

    long countByMd5(String md5);
}
