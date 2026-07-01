import { api } from './axios'

export interface PontoHistorico {
  data: string
  label: string
  totalInvestido: number
  totalAtual: number
  pnlNominal: number
}

export interface HistoricoPatrimonio {
  meses: number
  pontos: PontoHistorico[]
}

export const patrimonioApi = {
  historico: (meses = 12) =>
    api.get<HistoricoPatrimonio>('/api/v1/patrimonio/historico', { params: { meses } }).then(r => r.data),

  snapshot: () =>
    api.post('/api/v1/patrimonio/snapshot').then(r => r.data),
}
