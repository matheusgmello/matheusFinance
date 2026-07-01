CREATE TABLE proventos (
    id          BIGSERIAL PRIMARY KEY,
    perfil_id   BIGINT        NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    ticker      VARCHAR(20)   NOT NULL,
    tipo        VARCHAR(20)   NOT NULL CHECK (tipo IN ('DIVIDENDO', 'JCP', 'RENDIMENTO', 'AMORTIZACAO')),
    valor       NUMERIC(15,2) NOT NULL CHECK (valor > 0),
    data_pagamento DATE       NOT NULL,
    data_com    DATE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proventos_perfil_id     ON proventos(perfil_id);
CREATE INDEX idx_proventos_perfil_ticker ON proventos(perfil_id, ticker);
CREATE INDEX idx_proventos_data_pagamento ON proventos(perfil_id, data_pagamento DESC);
