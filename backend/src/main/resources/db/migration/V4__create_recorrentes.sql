CREATE TABLE pagamentos_recorrentes (
    id              BIGSERIAL PRIMARY KEY,
    perfil_id       BIGINT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    empresa         VARCHAR(100) NOT NULL,
    valor           NUMERIC(15, 2) NOT NULL,
    dia_vencimento  SMALLINT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    categoria       VARCHAR(100),
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE checklist_recorrentes (
    id              BIGSERIAL PRIMARY KEY,
    recorrente_id   BIGINT NOT NULL REFERENCES pagamentos_recorrentes(id) ON DELETE CASCADE,
    perfil_id       BIGINT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    ano             SMALLINT NOT NULL,
    mes             SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    pago            BOOLEAN NOT NULL DEFAULT FALSE,
    pago_em         TIMESTAMP WITH TIME ZONE,
    UNIQUE (recorrente_id, ano, mes)
);

CREATE INDEX idx_recorrentes_perfil    ON pagamentos_recorrentes(perfil_id);
CREATE INDEX idx_checklist_recorrente  ON checklist_recorrentes(recorrente_id);
CREATE INDEX idx_checklist_periodo     ON checklist_recorrentes(perfil_id, ano, mes);
