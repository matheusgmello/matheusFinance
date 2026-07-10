import { api } from '../../../core/api/axios'

// Receitas
export interface Receita {
  ano: number
  mes: number
  valor: number
}

export const receitasApi = {
  buscar: (ano: number, mes: number) =>
    api.get<Receita>('/api/receitas', { params: { ano, mes } }).then(r => r.data),
  salvar: (ano: number, mes: number, valor: number) =>
    api.put<Receita>('/api/receitas', { valor }, { params: { ano, mes } }).then(r => r.data),
}

// Fatura
export interface FaturaItem {
  parcelaId: number
  descricao: string
  categoria: string | null
  numeroParcela: number
  totalParcelas: number
  valor: number
  dataVencimento: string
  paga: boolean
}

export interface FaturaCartao {
  cartaoId: number
  cartaoNome: string
  diaVencimento: number
  total: number
  totalPago: number
  itens: FaturaItem[]
}

export interface Fatura {
  ano: number
  mes: number
  totalGeral: number
  totalPago: number
  cartoes: FaturaCartao[]
}

export const faturaApi = {
  get: (ano: number, mes: number) =>
    api.get<Fatura>('/api/fatura', { params: { ano, mes } }).then(r => r.data),
}

// Relatórios
async function download(url: string, filename: string) {
  const response = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  URL.revokeObjectURL(href)
}

export const relatoriosApi = {
  comprasAno: (ano: number) =>
    download(`/api/relatorios/compras.csv?ano=${ano}`, `compras-${ano}.csv`),

  gastosMes: (ano: number, mes: number) =>
    download(`/api/relatorios/gastos.csv?ano=${ano}&mes=${mes}`, `gastos-${ano}-${String(mes).padStart(2, '0')}.csv`),
}
