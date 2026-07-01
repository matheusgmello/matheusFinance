-- Adiciona CPF opcional ao perfil (necessário para preenchimento do DARF)
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
