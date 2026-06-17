package com.mikmok.backend.service;

import com.mikmok.backend.entity.Video;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface VideoService {
    Video uploadVideo(Long userId, String title, MultipartFile file);
    Page<Video> getMyVideos(Long userId, int page, int size);
    void deleteVideo(Long userId, Long videoId);
}
