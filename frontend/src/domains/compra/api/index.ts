import { api } from '../../../core/api/axios'

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

export interface ResultadoImportFatura {
  ano: number; mes: number; linhasImportadas: number; vencimento: string
}

export const comprasApi = {
  listar: () => api.get<Compra[]>('/api/compras').then(r => r.data),
  criar: (data: CompraRequest) => api.post<Compra>('/api/compras', data).then(r => r.data),
  atualizar: (id: number, data: CompraRequest) => api.put<Compra>(`/api/compras/${id}`, data).then(r => r.data),
  deletar: (id: number) => api.delete(`/api/compras/${id}`),
}

export const faturaApi = {
  importar: (cartaoId: number, ano: number, mes: number, banco: string, arquivo: File) => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    return api.post<ResultadoImportFatura[]>('/api/fatura/importar', formData, {
      params: { cartaoId, ano, mes, banco },
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}
