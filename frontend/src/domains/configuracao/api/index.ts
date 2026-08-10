import { api } from '../../../core/api/axios'
import { Profile } from '../../../core/types'

export type { Profile as Perfil }

// Perfis
export const perfisApi = {
  listar: () => api.get<Profile[]>('/api/perfis').then(r => r.data),
  criar: (nome: string) => api.post<Profile>('/api/perfis', { nome }).then(r => r.data),
  atualizar: (id: number, nome: string) => api.put<Profile>(`/api/perfis/${id}`, { nome }).then(r => r.data),
  deletar: (id: number) => api.delete(`/api/perfis/${id}`),

  exportar: async (id: number, nome: string) => {
    const response = await api.get(`/api/perfis/${id}/export`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `perfil-${nome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  importar: async (file: File): Promise<Profile> => {
    const text = await file.text()
    const backup = JSON.parse(text)
    return api.post<Profile>('/api/perfis/import', backup).then(r => r.data)
  },

  limparDados: (id: number) =>
    api.post(`/api/perfis/${id}/limpar`, { confirmar: 'CONFIRMAR' }),
}

// Categorias
export const CORES = [
  { value: 'slate',   label: 'Cinza',    tw: 'bg-slate-500'   },
  { value: 'red',     label: 'Vermelho', tw: 'bg-red-500'     },
  { value: 'orange',  label: 'Laranja',  tw: 'bg-orange-500'  },
  { value: 'amber',   label: 'Amarelo',  tw: 'bg-amber-500'   },
  { value: 'emerald', label: 'Verde',    tw: 'bg-emerald-500' },
  { value: 'teal',    label: 'Teal',     tw: 'bg-teal-500'    },
  { value: 'blue',    label: 'Azul',     tw: 'bg-blue-500'    },
  { value: 'violet',  label: 'Roxo',     tw: 'bg-violet-500'  },
  { value: 'pink',    label: 'Rosa',     tw: 'bg-pink-500'    },
  { value: 'rose',    label: 'Coral',    tw: 'bg-rose-500'    },
] as const

export type Cor = typeof CORES[number]['value']

export interface Categoria { id: number; nome: string; cor: Cor }
export interface CategoriaRequest { nome: string; cor: Cor }

export const categoriasApi = {
  listar: () => api.get<Categoria[]>('/api/categorias').then(r => r.data),
  criar:  (req: CategoriaRequest) => api.post<Categoria>('/api/categorias', req).then(r => r.data),
  atualizar: (id: number, req: CategoriaRequest) => api.put<Categoria>(`/api/categorias/${id}`, req).then(r => r.data),
  deletar: (id: number) => api.delete(`/api/categorias/${id}`),
}

// Orçamentos
export interface Orcamento {
  id: number
  categoria: string
  valorLimite: number
  gastoAtual: number
  percentual: number
}

export interface OrcamentoRequest {
  categoria: string
  valorLimite: number
}

export const orcamentosApi = {
  listar: (ano?: number, mes?: number) =>
    api.get<Orcamento[]>('/api/orcamentos', { params: { ano, mes } }).then(r => r.data),
  criar: (req: OrcamentoRequest) =>
    api.post<Orcamento>('/api/orcamentos', req).then(r => r.data),
  atualizar: (id: number, req: OrcamentoRequest) =>
    api.put<Orcamento>(`/api/orcamentos/${id}`, req).then(r => r.data),
  deletar: (id: number) =>
    api.delete(`/api/orcamentos/${id}`),
}

// Push
export const pushApi = {
  vapidPublicKey: () =>
    api.get<{ publicKey: string }>('/api/v1/push/vapid-public-key').then(r => r.data.publicKey),

  subscribe: (subscription: PushSubscriptionJSON) => {
    const keys = subscription.keys as Record<string, string>
    return api.post('/api/v1/push/subscribe', {
      endpoint: subscription.endpoint,
      p256dh: keys?.p256dh ?? '',
      auth: keys?.auth ?? '',
    })
  },

  unsubscribe: (endpoint: string) =>
    api.delete('/api/v1/push/unsubscribe', { params: { endpoint } }),
}
