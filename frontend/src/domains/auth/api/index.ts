import { api } from '../../../core/api/axios'
import { LoginResponse } from '../../../core/types'

export const authApi = {
  register: (email: string, nome: string, senha: string, confirmarSenha: string) =>
    api.post<LoginResponse>('/api/auth/register', { email, nome, senha, confirmarSenha }).then(r => r.data),

  login: (email: string, senha: string) =>
    api.post<LoginResponse>('/api/auth/login', { email, senha }).then(r => r.data),

  switchProfile: (perfilId: number) =>
    api.post<LoginResponse>('/api/auth/switch-profile', null, { params: { perfilId } }).then(r => r.data),
}
