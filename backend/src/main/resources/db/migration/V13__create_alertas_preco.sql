CREATE TABLE alertas_preco (
    id           BIGSERIAL     PRIMARY KEY,
    perfil_id    BIGINT        NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    ticker       VARCHAR(20)   NOT NULL,
    preco_alvo   NUMERIC(15,2) NOT NULL,
    direcao      VARCHAR(6)    NOT NULL CHECK (direcao IN ('ACIMA', 'ABAIXO')),
    ativo        BOOLEAN       NOT NULL DEFAULT TRUE,
    disparado_em TIMESTAMPTZ,
    criado_em    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alertas_preco_perfil ON alertas_preco (perfil_id);
CREATE INDEX idx_alertas_preco_ticker ON alertas_preco (ticker, ativo);
