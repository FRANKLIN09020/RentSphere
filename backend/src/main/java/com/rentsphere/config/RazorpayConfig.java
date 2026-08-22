package com.rentsphere.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

@Configuration
@EnableConfigurationProperties(RazorpayProperties.class)
public class RazorpayConfig {

    @Bean
    public RazorpayClient razorpayClient(RazorpayProperties properties) {
        try {
            return new RazorpayClient(properties.getKeyId(), properties.getKeySecret());
        } catch (RazorpayException e) {
            throw new IllegalStateException("Failed to initialize Razorpay client", e);
        }
    }
}
