package com.mikmok.backend.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mikmok.backend.entity.SystemLog;
import com.mikmok.backend.service.SystemLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class ApiMonitorAspect {

    private static final int MAX_BODY_LENGTH = 10000;

    private final SystemLogService systemLogService;
    private final ObjectMapper objectMapper;

    @Around("@within(org.springframework.web.bind.annotation.RestController)")
    public Object monitor(ProceedingJoinPoint joinPoint) throws Throwable {
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();

        Object result = null;
        Throwable thrown = null;
        try {
            result = joinPoint.proceed();
            return result;
        } catch (Throwable ex) {
            thrown = ex;
            throw ex;
        } finally {
            stopWatch.stop();
            try {
                recordLog(result, thrown, (int) stopWatch.getTotalTimeMillis());
            } catch (Exception e) {
                log.warn("Failed to record API monitor log", e);
            }
        }
    }

    private void recordLog(Object result, Throwable thrown, int durationMs) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return;
        }

        HttpServletRequest request = attributes.getRequest();
        SystemLog systemLog = new SystemLog();
        systemLog.setPath(request.getRequestURI());
        systemLog.setMethod(request.getMethod());
        systemLog.setUserId(resolveUserId());
        systemLog.setInputParams(buildInputParams(request));
        systemLog.setOutputData(buildOutputData(result, thrown));
        systemLog.setDurationMs(durationMs);
        systemLog.setCreatedAt(LocalDateTime.now());

        systemLogService.saveAsync(systemLog);
    }

    private Long resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long userId) {
            return userId;
        }
        return null;
    }

    private String buildInputParams(HttpServletRequest request) {
        try {
            Map<String, Object> params = new LinkedHashMap<>();
            String query = request.getQueryString();
            if (query != null && !query.isBlank()) {
                params.put("query", query);
            }

            if (request instanceof ContentCachingRequestWrapper wrapper) {
                byte[] body = wrapper.getContentAsByteArray();
                if (body.length > 0) {
                    String contentType = request.getContentType();
                    if (contentType != null && contentType.contains("multipart")) {
                        params.put("body", "[multipart/form-data]");
                    } else {
                        params.put("body", truncate(new String(body, StandardCharsets.UTF_8)));
                    }
                }
            }

            if (params.isEmpty()) {
                return "{}";
            }
            return objectMapper.writeValueAsString(params);
        } catch (Exception e) {
            return "{\"error\":\"failed to capture input\"}";
        }
    }

    private String buildOutputData(Object result, Throwable thrown) {
        try {
            if (thrown != null) {
                Map<String, String> error = Map.of(
                        "error", thrown.getClass().getSimpleName(),
                        "message", thrown.getMessage() != null ? thrown.getMessage() : ""
                );
                return truncate(objectMapper.writeValueAsString(error));
            }
            if (result == null) {
                return "null";
            }
            return truncate(objectMapper.writeValueAsString(result));
        } catch (Exception e) {
            return "{\"error\":\"failed to capture output\"}";
        }
    }

    private String truncate(String value) {
        if (value == null) {
            return null;
        }
        if (value.length() <= MAX_BODY_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_BODY_LENGTH) + "...[truncated]";
    }
}
