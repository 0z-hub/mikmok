package com.mikmok.backend.controller;

import com.mikmok.backend.common.Result;
import com.mikmok.backend.dto.PageResult;
import com.mikmok.backend.dto.VideoVo;
import com.mikmok.backend.entity.User;
import com.mikmok.backend.entity.Video;
import com.mikmok.backend.repository.UserRepository;
import com.mikmok.backend.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/my/videos")
@RequiredArgsConstructor
public class MyVideoController {
    private final VideoService videoService;
    private final UserRepository userRepository;

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Result<Map<String, Long>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description) {
        Long userId = getCurrentUserId();
        Video video = videoService.uploadVideo(userId, title, description, file);
        return Result.success(201, "发布成功", Map.of("id", video.getId()));
    }

    @GetMapping
    public Result<PageResult<VideoVo>> list(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        Page<Video> videos = videoService.getMyVideos(userId, page, size);

        User user = userRepository.findById(userId).orElseThrow();

        List<VideoVo> voList = videos.getContent().stream().map(v -> VideoVo.builder()
                .id(v.getId())
                .title(v.getTitle())
                .description(v.getDescription())
                .videoUrl(v.getVideoUrl())
                .authorName(user.getUsername())
                .likeCount(v.getLikeCount().longValue())
                .isLiked(false) // 个人列表暂不处理点赞状态，或根据需求扩展
                .fileSize(v.getFileSize())
                .contentType(v.getContentType())
                .createdAt(v.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        return Result.success(PageResult.of(videos.getTotalElements(), voList));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        videoService.deleteVideo(userId, id);
        return Result.success("删除成功", null);
    }
}
