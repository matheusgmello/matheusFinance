CREATE TABLE rebalanceamento_alvo (
    id          BIGSERIAL PRIMARY KEY,
    perfil_id   BIGINT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    label       VARCHAR(50) NOT NULL,
    tipo        VARCHAR(10) NOT NULL CHECK (tipo IN ('TICKER', 'CLASSE')),
    percentual_alvo NUMERIC(5,2) NOT NULL CHECK (percentual_alvo > 0 AND percentual_alvo <= 100),
    UNIQUE (perfil_id, label)
);
