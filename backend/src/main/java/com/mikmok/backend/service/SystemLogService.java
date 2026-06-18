package com.mikmok.backend.service;

import com.mikmok.backend.entity.SystemLog;
import com.mikmok.backend.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemLogService {

    private final SystemLogRepository systemLogRepository;

    @Async("logTaskExecutor")
    public void saveAsync(SystemLog systemLog) {
        try {
            systemLogRepository.save(systemLog);
        } catch (Exception e) {
            log.error("Failed to persist system log for path {}", systemLog.getPath(), e);
        }
    }
}
