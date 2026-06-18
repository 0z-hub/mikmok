package com.mikmok.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

@Configuration
public class TimeZoneConfig {

    public static final String APP_TIME_ZONE = "Asia/Shanghai";

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone(APP_TIME_ZONE));
    }
}
