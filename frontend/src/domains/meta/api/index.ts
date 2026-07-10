import { api } from '../../../core/api/axios'

export interface Meta {
  id: number
  nome: string
  valorAlvo: number
  valorAtual: number
  faltam: number
  percentual: number
  prazo: string | null
  previsaoConclusao: string | null
}

export interface MetaRequest {
  nome: string
  valorAlvo: number
  valorAtual?: number
  prazo?: string
}

export const metasApi = {
  listar: () => api.get<Meta[]>('/api/metas').then(r => r.data),
  criar: (req: MetaRequest) => api.post<Meta>('/api/metas', req).then(r => r.data),
  aportar: (id: number, valor: number) => api.post<Meta>(`/api/metas/${id}/aportes`, { valor }).then(r => r.data),
  atualizar: (id: number, req: MetaRequest) => api.put<Meta>(`/api/metas/${id}`, req).then(r => r.data),
  deletar: (id: number) => api.delete(`/api/metas/${id}`),
}
