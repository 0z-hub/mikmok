package com.mikmok.backend.service;

import com.mikmok.backend.config.JwtUtils;
import com.mikmok.backend.entity.User;
import com.mikmok.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtils jwtUtils;

    public String register(String username, String password) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("用户名已存在");
        }
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .role("USER")
                .build();
        userRepository.save(user);
        return "注册成功";
    }

    public String login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        return jwtUtils.generateToken(user.getUsername(), user.getId(), resolveRole(user));
    }

    private String resolveRole(User user) {
        return user.getRole() != null ? user.getRole() : "USER";
    }
}
