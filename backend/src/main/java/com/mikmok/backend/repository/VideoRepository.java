package com.mikmok.backend.repository;

import com.mikmok.backend.entity.Video;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface VideoRepository extends JpaRepository<Video, Long> {
    Page<Video> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Video> findFirstByMd5(String md5);

    long countByMd5(String md5);

    /**
     * 查询不在指定集合中的视频，按点赞数倒序排列，用于推荐兜底
     * 注意：ids 为空时请使用 findAllByOrderByLikeCountDesc
     */
    @Query("SELECT v FROM Video v WHERE v.id NOT IN :ids ORDER BY v.likeCount DESC")
    Page<Video> findByIdNotInOrderByLikeCountDesc(@Param("ids") Collection<Long> ids, Pageable pageable);

    Page<Video> findAllByOrderByLikeCountDesc(Pageable pageable);
}
