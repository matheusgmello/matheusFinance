CREATE TABLE orcamentos (
    id          BIGSERIAL PRIMARY KEY,
    perfil_id   BIGINT       NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    categoria   VARCHAR(100) NOT NULL,
    valor_limite NUMERIC(15, 2) NOT NULL,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (perfil_id, categoria)
);
