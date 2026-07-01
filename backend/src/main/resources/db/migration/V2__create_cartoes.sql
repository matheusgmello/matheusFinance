CREATE TABLE cartoes (
    id               BIGSERIAL PRIMARY KEY,
    perfil_id        BIGINT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    nome             VARCHAR(100) NOT NULL,
    dia_vencimento   SMALLINT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    dia_fechamento   SMALLINT NOT NULL CHECK (dia_fechamento BETWEEN 1 AND 31),
    criado_em        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cartoes_perfil ON cartoes(perfil_id);
