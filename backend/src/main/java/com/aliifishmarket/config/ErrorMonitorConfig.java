package com.aliifishmarket.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class ErrorMonitorConfig {

    @Value("${app.error-monitor.enabled:true}")
    private boolean errorMonitorEnabled;

    @Value("${app.error-monitor.endpoint:http://localhost:3030}")
    private String errorMonitorEndpoint;

    @Value("${app.error-monitor.api-key:}")
    private String errorMonitorApiKey;

    @Bean
    public RestTemplate errorMonitorRestTemplate() {
        return new RestTemplateBuilder()
            .rootUri(errorMonitorEndpoint)
            .defaultHeader("X-API-Key", errorMonitorApiKey)
            .build();
    }

    public boolean isErrorMonitorEnabled() {
        return errorMonitorEnabled;
    }

    public String getErrorMonitorEndpoint() {
        return errorMonitorEndpoint;
    }
}