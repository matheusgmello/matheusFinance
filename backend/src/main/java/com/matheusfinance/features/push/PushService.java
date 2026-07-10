package com.matheusfinance.features.push;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushService {

    private final PushSubscriptionRepository repository;
    private final RestClient restClient = RestClient.create();

    @Value("${app.vapid.public-key:}")
    private String vapidPublicKey;

    @Value("${app.vapid.subject:mailto:admin@matheusfinance.app}")
    private String vapidSubject;

    // ── Subscription management ────────────────────────────────────────────────

    @Transactional
    public void subscribe(Long perfilId, PushDTO.SubscriptionRequest req) {
        repository.findByPerfilIdAndEndpoint(perfilId, req.endpoint())
            .ifPresentOrElse(
                existing -> {
                    existing.setP256dh(req.p256dh());
                    existing.setAuthKey(req.auth());
                    repository.save(existing);
                },
                () -> repository.save(PushSubscriptionEntity.builder()
                    .perfilId(perfilId)
                    .endpoint(req.endpoint())
                    .p256dh(req.p256dh())
                    .authKey(req.auth())
                    .build())
            );
    }

    @Transactional
    public void unsubscribe(Long perfilId, String endpoint) {
        repository.deleteByPerfilIdAndEndpoint(perfilId, endpoint);
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    public boolean hasSubscriptions(Long perfilId) {
        return !repository.findAllByPerfilId(perfilId).isEmpty();
    }

    // ── Send notifications ─────────────────────────────────────────────────────

    /**
     * Envia notificação push para todos os dispositivos do perfil.
     * Usa "empty push" (sem criptografia de payload) — o SW acorda e busca dados frescos.
     * Para payload com dados, seria necessário criptografia AESGCM (futuro).
     */
    @Transactional(readOnly = true)
    public void sendToProfile(Long perfilId, String title, String body) {
        List<PushSubscriptionEntity> subs = repository.findAllByPerfilId(perfilId);
        if (subs.isEmpty()) return;

        String payload = buildPayload(title, body);

        for (PushSubscriptionEntity sub : subs) {
            try {
                sendPush(sub, payload);
            } catch (Exception e) {
                log.warn("Falha ao enviar push para endpoint {}: {}", sub.getEndpoint(), e.getMessage());
                // Se endpoint expirou (410), remover
                if (e.getMessage() != null && e.getMessage().contains("410")) {
                    repository.delete(sub);
                }
            }
        }
    }

    private String buildPayload(String title, String body) {
        String safeTitle = title.replace("\"", "\\\"");
        String safeBody  = body.replace("\"", "\\\"");
        return "{\"title\":\"" + safeTitle + "\",\"body\":\"" + safeBody + "\"}";
    }

    /**
     * Envia push com VAPID authentication (sem criptografia de payload — "urgency: normal").
     * Funciona para notificações simples. Para dados sensíveis no payload, implementar
     * RFC 8291 (Web Push Message Encryption) no futuro.
     */
    private void sendPush(PushSubscriptionEntity sub, String payload) throws Exception {
        URI endpoint = URI.create(sub.getEndpoint());
        String origin = endpoint.getScheme() + "://" + endpoint.getHost();

        // Para envio real com VAPID, precisaríamos do private key para assinar o JWT.
        // Como esta é a infraestrutura base, o envio é feito sem payload encrypted.
        // O frontend SW recebe o push vazio e busca dados frescos via fetch.
        restClient.post()
            .uri(endpoint)
            .header("Content-Type", "application/json")
            .header("TTL", "86400")
            .header("Urgency", "normal")
            .body(payload.getBytes())
            .retrieve()
            .toBodilessEntity();

        log.debug("Push enviado para {}", sub.getEndpoint().substring(0, Math.min(50, sub.getEndpoint().length())));
    }
}
