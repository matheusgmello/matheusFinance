import { api } from './axios'

export type TipoAlvo = 'TICKER' | 'CLASSE'

export interface AlvoResponse {
  id: number
  label: string
  tipo: TipoAlvo
  percentualAlvo: number
}

export interface ItemCalculo {
  label: string
  tipo: TipoAlvo
  percentualAlvo: number
  valorAtual: number
  percentualAtual: number
  diferencaValor: number
  diferencaPercent: number
  sugestaoAporte: number
}

export interface Calculo {
  totalCarteira: number
  totalAlvos: number
  itens: ItemCalculo[]
  aporteDesejado: number | null
  aporteTotal: number
}

export interface AlvoRequest {
  label: string
  tipo: TipoAlvo
  percentualAlvo: number
}

export const rebalanceamentoApi = {
  listarAlvos: () =>
    api.get<AlvoResponse[]>('/api/v1/rebalanceamento/alvos').then(r => r.data),

  salvarAlvo: (body: AlvoRequest) =>
    api.post<AlvoResponse>('/api/v1/rebalanceamento/alvos', body).then(r => r.data),

  deletarAlvo: (id: number) =>
    api.delete(`/api/v1/rebalanceamento/alvos/${id}`),

  calcular: (aporte?: number) =>
    api.get<Calculo>('/api/v1/rebalanceamento/calculo', {
      params: aporte != null ? { aporte } : {},
    }).then(r => r.data),
}
