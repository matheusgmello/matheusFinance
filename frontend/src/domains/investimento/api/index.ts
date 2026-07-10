import { api } from '../../../core/api/axios'
import { InvestmentType } from '../../../core/types'

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

// Patrimonio
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

// Proventos
export type TipoProvento = 'DIVIDENDO' | 'JCP' | 'RENDIMENTO' | 'AMORTIZACAO'

export interface ProventoResponse {
  id: number
  ticker: string
  tipo: TipoProvento
  valor: number
  dataPagamento: string
  dataCom: string | null
}

export interface ResumoPorMes {
  mes: string
  totalRecebido: number
}

export interface ResumoPorTicker {
  ticker: string
  totalRecebido: number
  yieldOnCost: number | null
}

export interface ResumoGeral {
  totalAllTime: number
  mediaUltimos12Meses: number
  porMes: ResumoPorMes[]
  porTicker: ResumoPorTicker[]
}

export interface ProjecaoPorTicker {
  ticker: string
  mediaMensal: number
  projecaoAnual: number
}

export interface ProjecaoRenda {
  totalMensalProjetado: number
  totalAnualProjetado: number
  porTicker: ProjecaoPorTicker[]
}

export interface CriarProventoRequest {
  ticker: string
  tipo: TipoProvento
  valor: number
  dataPagamento: string
  dataCom?: string
}

export interface CalendarioItem {
  id: number
  ticker: string
  tipo: TipoProvento
  valor: number
  dataPagamento: string
  recebido: boolean
}

export interface CalendarioMes {
  mes: string
  mesLabel: string
  total: number
  passado: boolean
  itens: CalendarioItem[]
}

export const proventosApi = {
  listar: (ticker?: string) =>
    api.get<ProventoResponse[]>('/api/v1/proventos', { params: ticker ? { ticker } : {} })
       .then(r => r.data),

  resumo: () =>
    api.get<ResumoGeral>('/api/v1/proventos/resumo').then(r => r.data),

  criar: (body: CriarProventoRequest) =>
    api.post<ProventoResponse>('/api/v1/proventos', body).then(r => r.data),

  projecao: () =>
    api.get<ProjecaoRenda>('/api/v1/proventos/projecao').then(r => r.data),

  deletar: (id: number) =>
    api.delete(`/api/v1/proventos/${id}`),

  calendario: (meses = 3) =>
    api.get<CalendarioMes[]>('/api/v1/proventos/calendario', { params: { meses } }).then(r => r.data),

  importarCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ImportResult>('/api/v1/proventos/import', form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data)
  },
}

// Rebalanceamento
export type TipoAlvo = 'TICKER' | 'CLASSE'

export interface AlvoResponse {
  id: number
  label: string
  tipo: TipoAlvo
  percentualAlvo: number
}

export interface ItemCalculo {
  label: string
  tipo: TipoAlvo
  percentualAlvo: number
  valorAtual: number
  percentualAtual: number
  diferencaValor: number
  diferencaPercent: number
  sugestaoAporte: number
}

export interface Calculo {
  totalCarteira: number
  totalAlvos: number
  itens: ItemCalculo[]
  aporteDesejado: number | null
  aporteTotal: number
}

export interface AlvoRequest {
  label: string
  tipo: TipoAlvo
  percentualAlvo: number
}

export const rebalanceamentoApi = {
  listarAlvos: () =>
    api.get<AlvoResponse[]>('/api/v1/rebalanceamento/alvos').then(r => r.data),

  salvarAlvo: (body: AlvoRequest) =>
    api.post<AlvoResponse>('/api/v1/rebalanceamento/alvos', body).then(r => r.data),

  deletarAlvo: (id: number) =>
    api.delete(`/api/v1/rebalanceamento/alvos/${id}`),

  calcular: (aporte?: number) =>
    api.get<Calculo>('/api/v1/rebalanceamento/calculo', {
      params: aporte != null ? { aporte } : {},
    }).then(r => r.data),
}

// Benchmarks
export interface PontoBenchmark {
  data: string
  label: string
  cdi: number | null
  ipca: number | null
  ibov: number | null
  carteira: number | null
}

export interface BenchmarkHistorico {
  dataInicio: string | null
  pontos: PontoBenchmark[]
}

export const benchmarksApi = {
  historico: (meses = 12) =>
    api.get<BenchmarkHistorico>('/api/v1/benchmarks/historico', { params: { meses } })
       .then(r => r.data),
}

// Investimentos Base
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
