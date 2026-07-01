-- Remove coluna de PIN legado. Autenticação agora é exclusivamente por e-mail + senha via tabela usuarios.
ALTER TABLE perfis DROP COLUMN IF EXISTS senha_hash;
