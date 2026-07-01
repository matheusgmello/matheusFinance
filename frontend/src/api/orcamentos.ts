import { api } from './axios'

export interface Orcamento {
  id: number
  categoria: string
  valorLimite: number
  gastoAtual: number
  percentual: number
}

export interface OrcamentoRequest {
  categoria: string
  valorLimite: number
}

export const orcamentosApi = {
  listar: (ano?: number, mes?: number) =>
    api.get<Orcamento[]>('/api/orcamentos', { params: { ano, mes } }).then(r => r.data),
  criar: (req: OrcamentoRequest) =>
    api.post<Orcamento>('/api/orcamentos', req).then(r => r.data),
  atualizar: (id: number, req: OrcamentoRequest) =>
    api.put<Orcamento>(`/api/orcamentos/${id}`, req).then(r => r.data),
  deletar: (id: number) =>
    api.delete(`/api/orcamentos/${id}`),
}
