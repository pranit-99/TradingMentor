package com.tradingmentor.trading_mentor_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                // allow your auth endpoints + basic api testing
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/**").permitAll()  // (TEMP) make all API public while building
                .anyRequest().permitAll()
            );

        return http.build();
    }
}
