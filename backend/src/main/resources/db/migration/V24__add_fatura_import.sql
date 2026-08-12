-- Marca qual fatura (cartão + mês de referência) originou uma compra importada.
-- NULL para compras criadas manualmente. É a chave de idempotência do import:
-- reimportar substitui todas as compras com o mesmo (cartao_id, fatura_mes_referencia).
ALTER TABLE compras_parceladas ADD COLUMN fatura_mes_referencia DATE;

CREATE INDEX idx_compras_fatura_import ON compras_parceladas(cartao_id, fatura_mes_referencia);
