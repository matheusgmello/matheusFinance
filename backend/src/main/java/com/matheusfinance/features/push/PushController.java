package com.matheusfinance.features.push;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/push")
@RequiredArgsConstructor
public class PushController {

    private final PushService pushService;

    @GetMapping("/vapid-public-key")
    public PushDTO.VapidPublicKeyResponse vapidPublicKey() {
        return new PushDTO.VapidPublicKeyResponse(pushService.getVapidPublicKey());
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @Valid @RequestBody PushDTO.SubscriptionRequest req) {
        pushService.subscribe(perfilId, req);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam String endpoint) {
        pushService.unsubscribe(perfilId, endpoint);
        return ResponseEntity.noContent().build();
    }
}
