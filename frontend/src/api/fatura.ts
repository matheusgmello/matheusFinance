import { api } from './axios'

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
