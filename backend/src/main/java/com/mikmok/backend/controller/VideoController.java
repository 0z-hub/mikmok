package com.mikmok.backend.controller;

import com.mikmok.backend.common.Result;
import com.mikmok.backend.dto.LikeResponse;
import com.mikmok.backend.dto.VideoVo;
import com.mikmok.backend.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoController {
    private final VideoService videoService;

    /**
     * 获取当前登录用户ID，未登录时返回 null
     */
    private Long getCurrentUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) {
            return (Long) auth.getPrincipal();
        }
        return null;
    }

    /**
     * 2.1 获取推荐视频流
     * 认证可选：登录后可去重
     */
    @GetMapping("/recommend")
    public Result<List<VideoVo>> recommend(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserIdOrNull();
        List<VideoVo> videos = videoService.getRecommendedVideos(userId, page, size);
        return Result.success(videos);
    }

    /**
     * 2.2 视频点赞/取消点赞
     * 需要登录
     */
    @PostMapping("/like/{id}")
    public Result<LikeResponse> toggleLike(@PathVariable Long id) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        LikeResponse response = videoService.toggleLike(userId, id);
        return Result.success("操作成功", response);
    }
}
