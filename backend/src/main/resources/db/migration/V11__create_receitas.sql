CREATE TABLE receitas (
    id        BIGSERIAL PRIMARY KEY,
    perfil_id BIGINT         NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    ano       INTEGER        NOT NULL,
    mes       INTEGER        NOT NULL,
    valor     NUMERIC(15, 2) NOT NULL,
    UNIQUE (perfil_id, ano, mes)
);
