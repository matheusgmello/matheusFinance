import { api } from './axios'

export type InvestmentType = 'STOCK' | 'FII' | 'TREASURY' | 'BDR' | 'ETF' | 'ETF_INT' | 'STOCK_INT' | 'RENDA_FIXA'

export interface PositionResponse {
  id: number
  ticker: string
  productName: string | null
  type: InvestmentType
  quantity: number
  averagePrice: number | null
  currentPrice: number | null
  totalValue: number
  institution: string | null
  maturityDate: string | null
  indexer: string | null
  taxaAnual: number | null
  referenceDate: string
  // P&L — null when averagePrice or currentPrice unavailable
  investedValue: number | null
  currentValue: number | null
  pnlNominal: number | null
  pnlPercent: number | null
  lastPriceUpdate: string | null
}

export interface SummaryResponse {
  totalStocks: number
  totalFiis: number
  totalTreasury: number
  grandTotal: number
  positions: PositionResponse[]
}

export interface ImportResult {
  imported: number
  skipped: number
}

export interface PontoHistorico {
  data: string
  label: string
  totalInvestido: number
  totalAtual: number
  pnlNominal: number
}

export interface Historico {
  meses: number
  pontos: PontoHistorico[]
}

export interface FiiMetrica {
  ticker: string
  pvp: number | null
  dividendYield: number | null
}

export const investimentosApi = {
  summary: () =>
    api.get<SummaryResponse>('/api/v1/investments/summary').then(r => r.data),

  importar: (file: File, referenceDate: string) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ImportResult>(
      `/api/v1/investments/import?referenceDate=${referenceDate}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then(r => r.data)
  },

  refreshPrices: () =>
    api.post<{ updated: number }>('/api/v1/investments/prices/refresh').then(r => r.data),

  refreshTreasury: () =>
    api.post<{ updated: number }>('/api/v1/investments/prices/refresh-treasury').then(r => r.data),

  historico: (meses = 12) =>
    api.get<Historico>('/api/v1/investments/historico', { params: { meses } }).then(r => r.data),

  fiiMetricas: () =>
    api.get<FiiMetrica[]>('/api/v1/investments/fii-metricas').then(r => r.data),
}
