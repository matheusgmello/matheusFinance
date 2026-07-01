-- Armazena as inscrições de push notification por perfil/dispositivo
CREATE TABLE push_subscriptions (
    id        BIGSERIAL    PRIMARY KEY,
    perfil_id BIGINT       NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    endpoint  TEXT         NOT NULL,
    p256dh    TEXT         NOT NULL,
    auth_key  TEXT         NOT NULL,
    criado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(perfil_id, endpoint)
);
CREATE INDEX idx_push_subscriptions_perfil ON push_subscriptions(perfil_id);
