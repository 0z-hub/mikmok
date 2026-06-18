package com.mikmok.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DurationStatVo {
    private String path;
    private Double avgDuration;
    private Integer maxDuration;
    private Long callCount;
}
