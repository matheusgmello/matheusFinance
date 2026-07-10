import { api } from '../../../core/api/axios'

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

export type Direcao = 'ACIMA' | 'ABAIXO'

export interface AlertaPreco {
  id: number
  ticker: string
  precoAlvo: number
  direcao: Direcao
  ativo: boolean
  disparadoEm: string | null
  criadoEm: string
}

export const alertasApi = {
  vencimentos: (dias = 3) =>
    api.get<Vencimentos>('/api/alertas/vencimentos', { params: { dias } }).then(r => r.data),
}

export const alertasPrecoApi = {
  listar: () => api.get<AlertaPreco[]>('/api/alertas-preco').then(r => r.data),
  disparados: () => api.get<AlertaPreco[]>('/api/alertas-preco/disparados').then(r => r.data),
  criar: (ticker: string, precoAlvo: number, direcao: Direcao) =>
    api.post<AlertaPreco>('/api/alertas-preco', { ticker, precoAlvo, direcao }).then(r => r.data),
  dispensar: (id: number) => api.post(`/api/alertas-preco/${id}/dispensar`),
  deletar: (id: number) => api.delete(`/api/alertas-preco/${id}`),
}
