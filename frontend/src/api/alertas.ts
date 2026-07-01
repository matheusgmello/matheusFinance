import { api } from './axios'

export interface ParcelaVencendo {
  parcelaId: number
  descricao: string
  cartao: string
  numeroParcela: number
  totalParcelas: number
  valor: number
  dataVencimento: string
  vencida: boolean
}

export interface RecorrenteVencendo {
  id: number
  empresa: string
  valor: number
  diaVencimento: number
  proximoVencimento: string
}

export interface Vencimentos {
  totalItens: number
  parcelas: ParcelaVencendo[]
  recorrentes: RecorrenteVencendo[]
}

export const alertasApi = {
  vencimentos: (dias = 3) =>
    api.get<Vencimentos>('/api/alertas/vencimentos', { params: { dias } }).then(r => r.data),
}
