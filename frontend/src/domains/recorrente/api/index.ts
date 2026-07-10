import { api } from '../../../core/api/axios'

export interface Recorrente {
  id: number; perfilId: number; empresa: string; valor: number
  diaVencimento: number; categoria: string | null; ativo: boolean; criadoEm: string
}
export interface RecorrenteRequest { empresa: string; valor: number; diaVencimento: number; categoria?: string }
export interface ChecklistItem {
  id: number | null; recorrenteId: number; empresa: string
  valor: number; diaVencimento: number; pago: boolean; pagoEm: string | null
}

export const recorrentesApi = {
  listar: () => api.get<Recorrente[]>('/api/recorrentes').then(r => r.data),
  criar: (data: RecorrenteRequest) => api.post<Recorrente>('/api/recorrentes', data).then(r => r.data),
  atualizar: (id: number, data: RecorrenteRequest) => api.put<Recorrente>(`/api/recorrentes/${id}`, data).then(r => r.data),
  inativar: (id: number) => api.delete(`/api/recorrentes/${id}`),
  checklist: (ano: number, mes: number) =>
    api.get<ChecklistItem[]>('/api/recorrentes/checklist', { params: { ano, mes } }).then(r => r.data),
  marcarPago: (id: number, ano: number, mes: number, pago: boolean) =>
    api.patch<ChecklistItem>(`/api/recorrentes/${id}/checklist`, { pago }, { params: { ano, mes } }).then(r => r.data),
}
