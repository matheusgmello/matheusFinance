// Auth
export interface LoginResponse {
  token: string
  perfilId: number
  perfilNome: string
}

// Profile
export interface Profile {
  id: number
  nome: string
  criadoEm: string
}

// IR/DARF types
export type TipoOperacao = 'COMPRA' | 'VENDA'
export type AssetType = 'STOCK' | 'FII' | 'TREASURY' | 'BDR' | 'ETF' | 'ETF_INT' | 'STOCK_INT'
export type Categoria = 'SWING_TRADE_ACAO' | 'DAY_TRADE_ACAO' | 'FII' | 'TREASURY' | 'BDR_ETF' | 'STOCK_INT'
export type InvestmentType = 'STOCK' | 'FII' | 'TREASURY' | 'BDR' | 'ETF' | 'ETF_INT' | 'STOCK_INT' | 'RENDA_FIXA'
