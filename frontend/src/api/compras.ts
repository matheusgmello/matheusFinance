import { api } from './axios'

export interface Parcela {
  id: number; numero: number; valor: number
  dataVencimento: string; paga: boolean; pagaEm: string | null
}
export interface Compra {
  id: number; perfilId: number; cartaoId: number; cartaoNome: string
  descricao: string; valorTotal: number; numParcelas: number
  dataCompra: string; categoria: string | null; criadoEm: string
  parcelas: Parcela[]
}
export interface CompraRequest {
  cartaoId: number; descricao: string; valorTotal: number
  numParcelas: number; dataCompra: string; categoria?: string
}

export const comprasApi = {
  listar: () => api.get<Compra[]>('/api/compras').then(r => r.data),
  criar: (data: CompraRequest) => api.post<Compra>('/api/compras', data).then(r => r.data),
  atualizar: (id: number, data: CompraRequest) => api.put<Compra>(`/api/compras/${id}`, data).then(r => r.data),
  deletar: (id: number) => api.delete(`/api/compras/${id}`),
}
