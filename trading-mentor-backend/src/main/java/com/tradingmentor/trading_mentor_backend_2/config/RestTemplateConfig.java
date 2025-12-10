package com.tradingmentor.trading_mentor_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Provides a single RestTemplate bean that we can inject
 * into our services to call external APIs (like Alpha Vantage).
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
