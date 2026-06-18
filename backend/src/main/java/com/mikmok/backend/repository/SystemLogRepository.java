package com.mikmok.backend.repository;

import com.mikmok.backend.entity.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {

    Page<SystemLog> findByUserId(Long userId, Pageable pageable);

    @Query("""
            SELECT s.path, s.method, AVG(s.durationMs), MAX(s.durationMs), COUNT(s)
            FROM SystemLog s
            GROUP BY s.path, s.method
            ORDER BY AVG(s.durationMs) DESC
            """)
    List<Object[]> aggregateDurationStats();
}
