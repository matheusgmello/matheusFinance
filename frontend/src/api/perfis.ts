import { api } from './axios'

export interface Perfil { id: number; nome: string; criadoEm: string }

export const perfisApi = {
  listar: () => api.get<Perfil[]>('/api/perfis').then(r => r.data),
  criar: (nome: string) => api.post<Perfil>('/api/perfis', { nome }).then(r => r.data),
  atualizar: (id: number, nome: string) => api.put<Perfil>(`/api/perfis/${id}`, { nome }).then(r => r.data),
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

  importar: async (file: File): Promise<Perfil> => {
    const text = await file.text()
    const backup = JSON.parse(text)
    return api.post<Perfil>('/api/perfis/import', backup).then(r => r.data)
  },

  limparDados: (id: number) =>
    api.post(`/api/perfis/${id}/limpar`, { confirmar: 'CONFIRMAR' }),
}
