package com.mikmok.backend.service;

import com.mikmok.backend.dto.LikeResponse;
import com.mikmok.backend.dto.VideoVo;
import com.mikmok.backend.entity.Video;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface VideoService {
    Video uploadVideo(Long userId, String title, MultipartFile file);
    Page<Video> getMyVideos(Long userId, int page, int size);
    void deleteVideo(Long userId, Long videoId);

    /**
     * 获取推荐视频流（可选登录态）
     * @param userId 用户ID（可为null，表示未登录）
     */
    List<VideoVo> getRecommendedVideos(Long userId, int page, int size);

    /**
     * 点赞/取消点赞
     */
    LikeResponse toggleLike(Long userId, Long videoId);
}
