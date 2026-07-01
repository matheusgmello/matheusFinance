CREATE TABLE categorias (
    id        BIGSERIAL PRIMARY KEY,
    perfil_id BIGINT       NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    nome      VARCHAR(100) NOT NULL,
    cor       VARCHAR(20)  NOT NULL DEFAULT 'slate',
    UNIQUE (perfil_id, nome)
);
