package com.mikmok.backend.service;

import com.mikmok.backend.entity.Video;
import com.mikmok.backend.repository.VideoRepository;
import com.mikmok.backend.service.impl.VideoServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import java.io.IOException;
import java.util.Optional;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class VideoServiceTest {

    @Mock
    private VideoRepository videoRepository;

    @Mock
    private FileStorageService fileStorageService;

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
        // Arrange
        when(videoRepository.findFirstByMd5(anyString())).thenReturn(Optional.empty());
        when(fileStorageService.upload(anyString(), any(), anyString())).thenReturn("http://minio/videos/test.mp4");
        when(videoRepository.save(any(Video.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Video result = videoService.uploadVideo(1L, "Test Title", mockFile);

        // Assert
        assertNotNull(result);
        assertEquals("Test Title", result.getTitle());
        assertEquals("http://minio/videos/test.mp4", result.getVideoUrl());
        verify(fileStorageService, times(1)).upload(anyString(), any(), anyString());
        verify(videoRepository, times(1)).save(any(Video.class));
    }

    @Test
    void uploadVideo_ExistingFile_ShouldUseExistingUrl() throws IOException {
        // Arrange
        Video existingVideo = new Video();
        existingVideo.setVideoUrl("http://minio/videos/existing.mp4");

        when(videoRepository.findFirstByMd5(anyString())).thenReturn(Optional.of(existingVideo));
        when(videoRepository.save(any(Video.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Video result = videoService.uploadVideo(1L, "Second Title", mockFile);

        // Assert
        assertNotNull(result);
        assertEquals("http://minio/videos/existing.mp4", result.getVideoUrl());
        // 验证没有调用上传方法
        verify(fileStorageService, never()).upload(anyString(), any(), anyString());
        verify(videoRepository, times(1)).save(any(Video.class));
    }

    @Test
    void deleteVideo_OnlyReference_ShouldDeletePhysicalFile() {
        // Arrange
        Video video = new Video();
        video.setId(100L);
        video.setUserId(1L);
        video.setMd5("some-md5");
        video.setVideoUrl("http://minio/videos/test.mp4");

        when(videoRepository.findById(100L)).thenReturn(Optional.of(video));
        when(videoRepository.countByMd5("some-md5")).thenReturn(1L);

        // Act
        videoService.deleteVideo(1L, 100L);

        // Assert
        verify(fileStorageService, times(1)).delete("test.mp4");
        verify(videoRepository, times(1)).delete(video);
    }

    @Test
    void deleteVideo_MultipleReferences_ShouldOnlyDeleteDatabaseRecord() {
        // Arrange
        Video video = new Video();
        video.setId(100L);
        video.setUserId(1L);
        video.setMd5("shared-md5");
        video.setVideoUrl("http://minio/videos/shared.mp4");

        when(videoRepository.findById(100L)).thenReturn(Optional.of(video));
        when(videoRepository.countByMd5("shared-md5")).thenReturn(2L);

        // Act
        videoService.deleteVideo(1L, 100L);

        // Assert
        // 验证没有调用删除物理文件的方法
        verify(fileStorageService, never()).delete(anyString());
        verify(videoRepository, times(1)).delete(video);
    }
}
