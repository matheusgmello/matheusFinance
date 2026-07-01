CREATE TABLE operacoes (
    id          BIGSERIAL PRIMARY KEY,
    perfil_id   BIGINT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    ticker      VARCHAR(20) NOT NULL,
    tipo        VARCHAR(6) NOT NULL CHECK (tipo IN ('COMPRA', 'VENDA')),
    quantidade  NUMERIC(18, 8) NOT NULL CHECK (quantidade > 0),
    preco       NUMERIC(15, 6) NOT NULL CHECK (preco > 0),
    data        DATE NOT NULL,
    day_trade   BOOLEAN NOT NULL DEFAULT FALSE,
    -- para tesouro: guarda data de compra do lote (FIFO)
    asset_type  VARCHAR(10) NOT NULL DEFAULT 'STOCK' CHECK (asset_type IN ('STOCK', 'FII', 'TREASURY')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operacoes_perfil_data ON operacoes(perfil_id, data);
