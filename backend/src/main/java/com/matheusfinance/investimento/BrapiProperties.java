package com.matheusfinance.investimento;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.brapi")
public record BrapiProperties(
        @DefaultValue("https://brapi.dev/api") String baseUrl,
        @DefaultValue("") String token,
        @DefaultValue("1") int batchSize
) {}
