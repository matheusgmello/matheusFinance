import { api } from './axios'

export interface CategoriaItem { categoria: string; valor: number }
export interface ResumoMes {
  ano: number; mes: number
  totalParcelas: number; totalRecorrentes: number; totalGeral: number
  receita: number; saldo: number
  categorias: CategoriaItem[]
}
export interface ProjecaoMes {
  ano: number; mes: number; label: string
  totalParcelas: number; totalRecorrentes: number; totalGeral: number
}
export interface PerfilResumo {
  perfilId: number; perfilNome: string
  receita: number; totalGeral: number; saldo: number
}
export interface ConsolidadoMes {
  ano: number; mes: number
  totalReceita: number; totalDespesas: number; totalSaldo: number
  perfis: PerfilResumo[]
}

export const dashboardApi = {
  resumo: (ano?: number, mes?: number) =>
    api.get<ResumoMes>('/api/dashboard/resumo', { params: { ano, mes } }).then(r => r.data),
  projecao: () => api.get<ProjecaoMes[]>('/api/dashboard/projecao').then(r => r.data),
  consolidado: (ano?: number, mes?: number) =>
    api.get<ConsolidadoMes>('/api/dashboard/consolidado', { params: { ano, mes } }).then(r => r.data),
}
