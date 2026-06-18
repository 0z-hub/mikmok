package com.mikmok.backend.service;

import com.mikmok.backend.entity.Video;
import com.mikmok.backend.repository.UserRepository;
import com.mikmok.backend.repository.VideoRepository;
import com.mikmok.backend.repository.WatchHistoryRepository;
import com.mikmok.backend.service.impl.VideoServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VideoServiceTest {

    @Mock
    private VideoRepository videoRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WatchHistoryRepository watchHistoryRepository;

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private StringRedisTemplate redisTemplate;

    @InjectMocks
    private VideoServiceImpl videoService;

    private MockMultipartFile mockFile;

    @BeforeEach
    void setUp() {
        mockFile = new MockMultipartFile(
                "file",
                "test.mp4",
                "video/mp4",
                "test video content".getBytes()
        );
    }

    @Test
    void uploadVideo_NewFile_ShouldUploadToMinio() throws IOException {
        when(videoRepository.findFirstByMd5(anyString())).thenReturn(Optional.empty());
        when(fileStorageService.upload(anyString(), any(), anyString())).thenReturn("http://minio/videos/test.mp4");
        when(videoRepository.save(any(Video.class))).thenAnswer(invocation -> {
            Video video = invocation.getArgument(0);
            if (video.getId() == null) {
                video.setId(1L);
            }
            return video;
        });

        Video result = videoService.uploadVideo(1L, "Test Title", null, mockFile);

        assertNotNull(result);
        assertEquals("Test Title", result.getTitle());
        assertEquals("http://minio/videos/test.mp4", result.getVideoUrl());
        verify(fileStorageService, times(1)).upload(anyString(), any(), anyString());
        verify(videoRepository, times(1)).save(any(Video.class));
    }

    @Test
    void uploadVideo_ExistingFile_ShouldUseExistingUrl() throws IOException {
        Video existingVideo = new Video();
        existingVideo.setId(2L);
        existingVideo.setVideoUrl("http://minio/videos/existing.mp4");

        when(videoRepository.findFirstByMd5(anyString())).thenReturn(Optional.of(existingVideo));
        when(videoRepository.save(any(Video.class))).thenAnswer(invocation -> {
            Video video = invocation.getArgument(0);
            if (video.getId() == null) {
                video.setId(2L);
            }
            return video;
        });

        Video result = videoService.uploadVideo(1L, "Second Title", null, mockFile);

        assertNotNull(result);
        assertEquals("http://minio/videos/existing.mp4", result.getVideoUrl());
        verify(fileStorageService, never()).upload(anyString(), any(), anyString());
        verify(videoRepository, times(1)).save(any(Video.class));
    }

    @Test
    void updateVideo_Owner_ShouldUpdateTitleAndDescription() {
        Video video = new Video();
        video.setId(100L);
        video.setUserId(1L);
        video.setTitle("Old Title");
        video.setDescription("Old desc");
        video.setCreatedAt(java.time.LocalDateTime.of(2026, 6, 1, 10, 0));

        when(videoRepository.findById(100L)).thenReturn(Optional.of(video));
        when(videoRepository.save(any(Video.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Video result = videoService.updateVideo(1L, 100L, "New Title", "New desc");

        assertEquals("New Title", result.getTitle());
        assertEquals("New desc", result.getDescription());
        assertEquals(java.time.LocalDateTime.of(2026, 6, 1, 10, 0), result.getCreatedAt());
        verify(videoRepository, times(1)).save(video);
    }

    @Test
    void deleteVideo_OnlyReference_ShouldDeletePhysicalFile() {
        Video video = new Video();
        video.setId(100L);
        video.setUserId(1L);
        video.setMd5("some-md5");
        video.setVideoUrl("http://minio/videos/test.mp4");

        when(videoRepository.findById(100L)).thenReturn(Optional.of(video));
        when(videoRepository.countByMd5("some-md5")).thenReturn(1L);

        videoService.deleteVideo(1L, 100L);

        verify(fileStorageService, times(1)).delete("test.mp4");
        verify(videoRepository, times(1)).delete(video);
    }

    @Test
    void deleteVideo_MultipleReferences_ShouldOnlyDeleteDatabaseRecord() {
        Video video = new Video();
        video.setId(100L);
        video.setUserId(1L);
        video.setMd5("shared-md5");
        video.setVideoUrl("http://minio/videos/shared.mp4");

        when(videoRepository.findById(100L)).thenReturn(Optional.of(video));
        when(videoRepository.countByMd5("shared-md5")).thenReturn(2L);

        videoService.deleteVideo(1L, 100L);

        verify(fileStorageService, never()).delete(anyString());
        verify(videoRepository, times(1)).delete(video);
    }
}
