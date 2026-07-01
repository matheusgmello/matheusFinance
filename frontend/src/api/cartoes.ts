import { api } from './axios'

export interface Cartao {
  id: number; perfilId: number; nome: string
  diaVencimento: number; diaFechamento: number; criadoEm: string
}
export interface CartaoRequest { nome: string; diaVencimento: number; diaFechamento: number }

export const cartoesApi = {
  listar: () => api.get<Cartao[]>('/api/cartoes').then(r => r.data),
  criar: (data: CartaoRequest) => api.post<Cartao>('/api/cartoes', data).then(r => r.data),
  atualizar: (id: number, data: CartaoRequest) => api.put<Cartao>(`/api/cartoes/${id}`, data).then(r => r.data),
  deletar: (id: number) => api.delete(`/api/cartoes/${id}`),
}
