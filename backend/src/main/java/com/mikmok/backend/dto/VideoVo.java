package com.mikmok.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoVo {
    private Long id;
    private String title;
    private String description;
    private String videoUrl;
    private String authorName;
    private Long likeCount;
    private Boolean isLiked;
    private Long fileSize;
    private String contentType;
    private LocalDateTime createdAt;
}
