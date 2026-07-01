import { api } from './axios'

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
