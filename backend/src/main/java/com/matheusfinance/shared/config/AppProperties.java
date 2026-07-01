package com.matheusfinance.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Cors cors) {
    public record Cors(List<String> allowedOrigins) {}
}
