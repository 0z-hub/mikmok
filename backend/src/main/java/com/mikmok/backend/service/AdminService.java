package com.mikmok.backend.service;

import com.mikmok.backend.dto.DurationStatVo;
import com.mikmok.backend.dto.PageResult;
import com.mikmok.backend.dto.SystemLogVo;
import com.mikmok.backend.entity.SystemLog;
import com.mikmok.backend.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final SystemLogRepository systemLogRepository;

    public PageResult<SystemLogVo> getLogs(int page, int size, Long userId) {
        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SystemLog> result = userId != null
                ? systemLogRepository.findByUserId(userId, pageRequest)
                : systemLogRepository.findAll(pageRequest);

        List<SystemLogVo> list = result.getContent().stream()
                .map(this::toVo)
                .toList();
        return PageResult.of(result.getTotalElements(), list);
    }

    public List<DurationStatVo> getDurationStats() {
        return systemLogRepository.aggregateDurationStats().stream()
                .map(row -> DurationStatVo.builder()
                        .path(formatStatPath((String) row[0], (String) row[1]))
                        .avgDuration(roundOneDecimal(((Number) row[2]).doubleValue()))
                        .maxDuration(((Number) row[3]).intValue())
                        .callCount(((Number) row[4]).longValue())
                        .build())
                .toList();
    }

    private SystemLogVo toVo(SystemLog log) {
        return SystemLogVo.builder()
                .id(log.getId())
                .path(log.getPath())
                .method(log.getMethod())
                .userId(log.getUserId())
                .inputParams(log.getInputParams())
                .outputData(log.getOutputData())
                .durationMs(log.getDurationMs())
                .createdAt(log.getCreatedAt())
                .build();
    }

    static String formatStatPath(String path, String method) {
        if ("GET".equalsIgnoreCase(method)) {
            return path;
        }
        return path + " (" + method + ")";
    }

    private static double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
