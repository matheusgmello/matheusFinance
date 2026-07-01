import { api } from './axios'

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
  mes: string        // "2026-05"
  mesLabel: string   // "Mai/2026"
  total: number
  passado: boolean
  itens: CalendarioItem[]
}

export interface ImportResult {
  imported: number
  skipped: number
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
