CREATE TABLE compras_parceladas (
    id              BIGSERIAL PRIMARY KEY,
    perfil_id       BIGINT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    cartao_id       BIGINT NOT NULL REFERENCES cartoes(id) ON DELETE CASCADE,
    descricao       VARCHAR(255) NOT NULL,
    valor_total     NUMERIC(15, 2) NOT NULL,
    num_parcelas    SMALLINT NOT NULL CHECK (num_parcelas >= 1),
    data_compra     DATE NOT NULL,
    categoria       VARCHAR(100),
    criado_em       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE parcelas (
    id              BIGSERIAL PRIMARY KEY,
    compra_id       BIGINT NOT NULL REFERENCES compras_parceladas(id) ON DELETE CASCADE,
    perfil_id       BIGINT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    numero          SMALLINT NOT NULL,
    valor           NUMERIC(15, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    paga            BOOLEAN NOT NULL DEFAULT FALSE,
    paga_em         TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_compras_perfil   ON compras_parceladas(perfil_id);
CREATE INDEX idx_compras_cartao   ON compras_parceladas(cartao_id);
CREATE INDEX idx_parcelas_compra  ON parcelas(compra_id);
CREATE INDEX idx_parcelas_perfil  ON parcelas(perfil_id);
CREATE INDEX idx_parcelas_venc    ON parcelas(data_vencimento);
