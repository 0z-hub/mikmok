package com.mikmok.backend.controller;

import com.mikmok.backend.common.Result;
import com.mikmok.backend.dto.DurationStatVo;
import com.mikmok.backend.dto.PageResult;
import com.mikmok.backend.dto.SystemLogVo;
import com.mikmok.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/logs")
    public Result<PageResult<SystemLogVo>> getLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long userId) {
        return Result.success(adminService.getLogs(page, size, userId));
    }

    @GetMapping("/stats/duration")
    public Result<List<DurationStatVo>> getDurationStats() {
        return Result.success(adminService.getDurationStats());
    }
}
