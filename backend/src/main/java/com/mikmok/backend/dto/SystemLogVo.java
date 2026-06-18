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
public class SystemLogVo {
    private Long id;
    private String path;
    private String method;
    private Long userId;
    private String inputParams;
    private String outputData;
    private Integer durationMs;
    private LocalDateTime createdAt;
}
