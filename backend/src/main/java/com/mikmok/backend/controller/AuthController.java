package com.mikmok.backend.controller;

import com.mikmok.backend.common.Result;
import com.mikmok.backend.dto.LoginResponse;
import com.mikmok.backend.entity.User;
import com.mikmok.backend.repository.UserRepository;
import com.mikmok.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public Result<Void> register(@RequestBody Map<String, String> request) {
        authService.register(request.get("username"), request.get("password"));
        return Result.success("注册成功", null);
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String token = authService.login(username, request.get("password"));

        // 获取用户信息以填充响应
        User user = userRepository.findByUsername(username).orElseThrow();

        LoginResponse response = LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role("USER") // 目前默认为 USER，后续可扩展
                .build();

        return Result.success("登录成功", response);
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        // JWT 退出通常在前端清除 token，后端如果需要黑名单可以在此处理
        return Result.success("退出成功", null);
    }
}
