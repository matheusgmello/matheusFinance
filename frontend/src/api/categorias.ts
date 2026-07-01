import { api } from './axios'

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
