package com.mikmok.backend.service.impl;

import com.mikmok.backend.dto.LikeResponse;
import com.mikmok.backend.dto.VideoVo;
import com.mikmok.backend.entity.User;
import com.mikmok.backend.entity.Video;
import com.mikmok.backend.entity.WatchHistory;
import com.mikmok.backend.repository.UserRepository;
import com.mikmok.backend.repository.VideoRepository;
import com.mikmok.backend.repository.WatchHistoryRepository;
import com.mikmok.backend.service.FileStorageService;
import com.mikmok.backend.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VideoServiceImpl implements VideoService {
    private final VideoRepository videoRepository;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final WatchHistoryRepository watchHistoryRepository;
    private final StringRedisTemplate redisTemplate;

    private static final String REDIS_RANK_KEY = "mikmok:video:rank";
    private static final String REDIS_USER_WATCHED_PREFIX = "mikmok:user:watched:";
    private static final String REDIS_USER_LIKED_PREFIX = "mikmok:user:liked:";

    @Override
    @Transactional
    public Video uploadVideo(Long userId, String title, MultipartFile file) {
        try {
            // 计算 MD5
            String md5 = DigestUtils.md5DigestAsHex(file.getInputStream());

            Video video = new Video();
            video.setUserId(userId);
            video.setTitle(title);
            video.setMd5(md5);
            video.setFileSize(file.getSize());
            video.setContentType(file.getContentType());

            // 秒传逻辑：检查 MD5 是否已存在
            videoRepository.findFirstByMd5(md5).ifPresentOrElse(
                existing -> {
                    // 如果存在，直接复用 URL
                    video.setVideoUrl(existing.getVideoUrl());
                },
                () -> {
                    // 如果不存在，上传到 MinIO
                    String originalFilename = file.getOriginalFilename();
                    String extension = "";
                    if (originalFilename != null && originalFilename.contains(".")) {
                        extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    }
                    String objectName = UUID.randomUUID().toString() + extension;

                    try {
                        String url = fileStorageService.upload(objectName, file.getInputStream(), file.getContentType());
                        video.setVideoUrl(url);
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to upload file to storage", e);
                    }
                }
            );

            Video saved = videoRepository.save(video);

            // 初始化排行榜：新视频加入 ZSet，分数为 0
            redisTemplate.opsForZSet().add(REDIS_RANK_KEY, saved.getId().toString(), 0);

            return saved;
        } catch (Exception e) {
            throw new RuntimeException("Video upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public Page<Video> getMyVideos(Long userId, int page, int size) {
        return videoRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page - 1, size));
    }

    @Override
    @Transactional
    public void deleteVideo(Long userId, Long videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Video not found"));

        // 所有权校验
        if (!video.getUserId().equals(userId)) {
            throw new RuntimeException("Forbidden: You don't have permission to delete this video");
        }

        // 引用检查：如果该 MD5 只有当前这一条记录引用，则删除 MinIO 中的物理文件
        if (videoRepository.countByMd5(video.getMd5()) <= 1) {
            // 从 URL 中提取 objectName
            String videoUrl = video.getVideoUrl();
            String objectName = videoUrl.substring(videoUrl.lastIndexOf("/") + 1);
            fileStorageService.delete(objectName);
        }

        videoRepository.delete(video);

        // 从排行榜中移除
        redisTemplate.opsForZSet().remove(REDIS_RANK_KEY, videoId.toString());
    }

    @Override
    public List<VideoVo> getRecommendedVideos(Long userId, int page, int size) {
        // 1. 预热缓存（仅登录用户）
        if (userId != null) {
            ensureUserCache(userId);
        }

        // 2. 获取已看视频集合（仅登录用户）
        Set<Long> excludeIds = new HashSet<>();
        if (userId != null) {
            Set<String> watched = redisTemplate.opsForSet()
                    .members(REDIS_USER_WATCHED_PREFIX + userId);
            if (watched != null && !watched.isEmpty()) {
                excludeIds = watched.stream()
                        .filter(s -> !"EMPTY".equals(s))
                        .map(Long::valueOf)
                        .collect(Collectors.toSet());
            }
        }

        // 3. 从 Redis ZSet 获取按热度排序的候选视频 ID
        Set<Long> candidateIds = new LinkedHashSet<>(); // 保持顺序
        Set<String> rankedSet = redisTemplate.opsForZSet()
                .reverseRange(REDIS_RANK_KEY, 0, 99);
        if (rankedSet != null) {
            for (String idStr : rankedSet) {
                Long vid = Long.valueOf(idStr);
                if (!excludeIds.contains(vid)) {
                    candidateIds.add(vid);
                }
            }
        }

        // 4. 分页截取
        List<Long> resultIds = new ArrayList<>();
        int skip = (page - 1) * size;
        int count = 0;
        for (Long id : candidateIds) {
            if (skip > 0) {
                skip--;
                continue;
            }
            if (count >= size) break;
            resultIds.add(id);
            count++;
        }

        // 5. 兜底逻辑：从数据库补足
        if (resultIds.size() < size) {
            int needed = size - resultIds.size();
            Set<Long> allExclude = new HashSet<>(excludeIds);
            allExclude.addAll(resultIds);

            Page<Video> supplement;
            if (allExclude.isEmpty()) {
                supplement = videoRepository.findAllByOrderByLikeCountDesc(PageRequest.of(0, needed));
            } else {
                supplement = videoRepository.findByIdNotInOrderByLikeCountDesc(allExclude, PageRequest.of(0, needed));
            }
            for (Video v : supplement.getContent()) {
                resultIds.add(v.getId());
            }

            // 如果还是不够（说明用户看完了所有过滤后的视频），则执行最终兜底：忽略已看限制，按热度随机补全
            if (resultIds.size() < size) {
                int finalNeeded = size - resultIds.size();
                Page<Video> finalFallback = videoRepository.findAllByOrderByLikeCountDesc(PageRequest.of(0, finalNeeded));
                for (Video v : finalFallback.getContent()) {
                    if (!resultIds.contains(v.getId())) {
                        resultIds.add(v.getId());
                    }
                    if (resultIds.size() >= size) break;
                }
            }
        }

        // 6. 查询视频详情
        List<Video> videos = videoRepository.findAllById(resultIds);
        Map<Long, Video> videoMap = videos.stream()
                .collect(Collectors.toMap(Video::getId, v -> v));
        List<Video> orderedVideos = resultIds.stream()
                .map(videoMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // 7. 记录已看（登录用户）
        if (userId != null && !resultIds.isEmpty()) {
            String[] strIds = resultIds.stream().map(String::valueOf).toArray(String[]::new);
            redisTemplate.opsForSet().add(REDIS_USER_WATCHED_PREFIX + userId, strIds);
            // 异步入库
            recordWatchHistoryAsync(userId, resultIds);
        }

        // 8. 构建响应
        return orderedVideos.stream().map(v -> {
            String authorName = userRepository.findById(v.getUserId())
                    .map(User::getUsername).orElse("Unknown");
            boolean isLiked = userId != null && Boolean.TRUE.equals(
                    redisTemplate.opsForSet().isMember(REDIS_USER_LIKED_PREFIX + userId, v.getId().toString()));

            return VideoVo.builder()
                    .id(v.getId())
                    .title(v.getTitle())
                    .videoUrl(v.getVideoUrl())
                    .authorName(authorName)
                    .likeCount(v.getLikeCount().longValue())
                    .isLiked(isLiked)
                    .createdAt(v.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    private void ensureUserCache(Long userId) {
        String watchedKey = REDIS_USER_WATCHED_PREFIX + userId;
        if (Boolean.FALSE.equals(redisTemplate.hasKey(watchedKey))) {
            List<WatchHistory> history = watchHistoryRepository.findByUserId(userId);
            if (!history.isEmpty()) {
                for (WatchHistory wh : history) {
                    redisTemplate.opsForSet().add(watchedKey, wh.getVideoId().toString());
                    if (wh.getIsLiked()) {
                        redisTemplate.opsForSet().add(REDIS_USER_LIKED_PREFIX + userId, wh.getVideoId().toString());
                    }
                }
                redisTemplate.expire(watchedKey, Duration.ofHours(24));
                redisTemplate.expire(REDIS_USER_LIKED_PREFIX + userId, Duration.ofHours(24));
            } else {
                // 防止缓存击穿，存入一个空标记
                redisTemplate.opsForSet().add(watchedKey, "EMPTY");
                redisTemplate.expire(watchedKey, Duration.ofMinutes(5));
            }
        }
    }

    @Async
    public void recordWatchHistoryAsync(Long userId, List<Long> videoIds) {
        for (Long vid : videoIds) {
            watchHistoryRepository.findByUserIdAndVideoId(userId, vid).ifPresentOrElse(
                    existing -> {
                    }, // 已存在不处理
                    () -> {
                        WatchHistory wh = new WatchHistory();
                        wh.setUserId(userId);
                        wh.setVideoId(vid);
                        wh.setIsLiked(false);
                        watchHistoryRepository.save(wh);
                    }
            );
        }
    }

    @Override
    @Transactional
    public LikeResponse toggleLike(Long userId, Long videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("视频不存在"));

        String likedKey = REDIS_USER_LIKED_PREFIX + userId;
        String member = videoId.toString();
        Boolean alreadyLiked = redisTemplate.opsForSet().isMember(likedKey, member);

        if (Boolean.TRUE.equals(alreadyLiked)) {
            // 取消点赞
            redisTemplate.opsForSet().remove(likedKey, member);
            video.setLikeCount(Math.max(0, video.getLikeCount() - 1));
            redisTemplate.opsForZSet().incrementScore(REDIS_RANK_KEY, member, -1);
            videoRepository.save(video);

            // 同步更新数据库状态
            watchHistoryRepository.findByUserIdAndVideoId(userId, videoId).ifPresent(wh -> {
                wh.setIsLiked(false);
                wh.setUpdatedAt(LocalDateTime.now());
                watchHistoryRepository.save(wh);
            });

            return LikeResponse.builder()
                    .liked(false)
                    .currentLikeCount(video.getLikeCount())
                    .build();
        } else {
            // 点赞
            redisTemplate.opsForSet().add(likedKey, member);
            video.setLikeCount(video.getLikeCount() + 1);
            redisTemplate.opsForZSet().incrementScore(REDIS_RANK_KEY, member, 1);
            videoRepository.save(video);

            // 同时记录到已看集合
            redisTemplate.opsForSet().add(REDIS_USER_WATCHED_PREFIX + userId, member);

            // 同步更新数据库状态
            WatchHistory wh = watchHistoryRepository.findByUserIdAndVideoId(userId, videoId)
                    .orElseGet(() -> {
                        WatchHistory newWh = new WatchHistory();
                        newWh.setUserId(userId);
                        newWh.setVideoId(videoId);
                        return newWh;
                    });
            wh.setIsLiked(true);
            wh.setUpdatedAt(LocalDateTime.now());
            watchHistoryRepository.save(wh);

            return LikeResponse.builder()
                    .liked(true)
                    .currentLikeCount(video.getLikeCount())
                    .build();
        }
    }
}
