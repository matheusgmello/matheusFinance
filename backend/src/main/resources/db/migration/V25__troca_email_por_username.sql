-- Login deixa de ser por e-mail; passa a ser usuário + senha.
-- UNIQUE em email é preservado no rename (Postgres mantém a constraint pela coluna, não pelo nome).
ALTER TABLE usuarios RENAME COLUMN email TO username;

-- Nome próprio de usuário não é mais necessário: Perfil.nome (já existente,
-- sempre obrigatório) é quem de fato representa o nome de exibição.
ALTER TABLE usuarios DROP COLUMN nome;
