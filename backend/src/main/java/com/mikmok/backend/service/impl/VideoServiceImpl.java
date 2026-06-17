package com.mikmok.backend.service.impl;

import com.mikmok.backend.entity.Video;
import com.mikmok.backend.repository.VideoRepository;
import com.mikmok.backend.service.FileStorageService;
import com.mikmok.backend.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VideoServiceImpl implements VideoService {
    private final VideoRepository videoRepository;
    private final FileStorageService fileStorageService;

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

            return videoRepository.save(video);
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
    }
}
