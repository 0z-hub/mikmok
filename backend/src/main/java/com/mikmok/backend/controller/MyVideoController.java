package com.mikmok.backend.controller;

import com.mikmok.backend.entity.Video;
import com.mikmok.backend.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/my/videos")
@RequiredArgsConstructor
public class MyVideoController {
    private final VideoService videoService;

    private Long getCurrentUserId() {
        // 从 SecurityContext 获取我们在 JwtAuthenticationFilter 中存入的 userId
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file, @RequestParam("title") String title) {
        Long userId = getCurrentUserId();
        Video video = videoService.uploadVideo(userId, title, file);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 201);
        response.put("message", "发布成功");
        response.put("data", Map.of("id", video.getId()));

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        Page<Video> videos = videoService.getMyVideos(userId, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", Map.of(
            "total", videos.getTotalElements(),
            "list", videos.getContent()
        ));

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        videoService.deleteVideo(userId, id);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "删除成功");

        return ResponseEntity.ok(response);
    }
}
