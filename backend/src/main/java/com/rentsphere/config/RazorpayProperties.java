package com.rentsphere.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.razorpay")
public class RazorpayProperties {

    private String keyId = "";

    private String keySecret = "";

    private String webhookSecret = "";
}
