package com.matheusfinance.features.push;

import jakarta.validation.constraints.NotBlank;

public class PushDTO {

    public record SubscriptionRequest(
        @NotBlank String endpoint,
        @NotBlank String p256dh,
        @NotBlank String auth
    ) {}

    public record VapidPublicKeyResponse(String publicKey) {}
}
