CREATE TABLE patrimonio_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    perfil_id       BIGINT         NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    data            DATE           NOT NULL,
    total_investido NUMERIC(15, 2) NOT NULL,
    total_atual     NUMERIC(15, 2) NOT NULL,
    UNIQUE (perfil_id, data)
);

CREATE INDEX idx_patrimonio_perfil_data ON patrimonio_snapshots (perfil_id, data);
