-- Amplia suporte a novos tipos de ativo em operacoes e investment_positions

-- Remove o CHECK constraint antigo de operacoes.asset_type
ALTER TABLE operacoes
    DROP CONSTRAINT IF EXISTS operacoes_asset_type_check;

-- Novo CHECK incluindo todos os tipos
ALTER TABLE operacoes
    ADD CONSTRAINT operacoes_asset_type_check
    CHECK (asset_type IN ('STOCK','FII','TREASURY','BDR','ETF','ETF_INT','STOCK_INT'));

-- Ampliar varchar para acomodar os nomes mais longos
ALTER TABLE operacoes
    ALTER COLUMN asset_type TYPE VARCHAR(20);

ALTER TABLE investment_positions
    ALTER COLUMN type TYPE VARCHAR(20);
