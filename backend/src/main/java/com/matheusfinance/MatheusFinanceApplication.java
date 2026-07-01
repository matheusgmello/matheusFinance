package com.matheusfinance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MatheusFinanceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MatheusFinanceApplication.class, args);
    }
}
