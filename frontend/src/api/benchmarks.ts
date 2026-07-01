import { api } from './axios'

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
