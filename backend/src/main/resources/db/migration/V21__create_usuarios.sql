-- Tabela de usuários para login por e-mail (multi-tenant)
CREATE TABLE usuarios (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    nome       VARCHAR(100) NOT NULL,
    criado_em  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Vincula perfis existentes a usuários (nullable para não quebrar dados existentes)
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_perfis_usuario_id ON perfis(usuario_id);
