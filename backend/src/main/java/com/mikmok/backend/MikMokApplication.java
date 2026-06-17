package com.mikmok.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MikMokApplication {
    public static void main(String[] args) {
        SpringApplication.run(MikMokApplication.class, args);
    }
}
