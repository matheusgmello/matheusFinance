CREATE TABLE metas (
    id           BIGSERIAL PRIMARY KEY,
    perfil_id    BIGINT         NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    nome         VARCHAR(150)   NOT NULL,
    valor_alvo   NUMERIC(15,2)  NOT NULL,
    valor_atual  NUMERIC(15,2)  NOT NULL DEFAULT 0,
    prazo        DATE,
    criado_em    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
