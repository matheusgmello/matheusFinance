import { api } from '../../../core/api/axios'
import { LoginResponse } from '../../../core/types'

export const authApi = {
  register: (usuario: string, senha: string, confirmarSenha: string) =>
    api.post<LoginResponse>('/api/auth/register', { usuario, senha, confirmarSenha }).then(r => r.data),

  login: (usuario: string, senha: string) =>
    api.post<LoginResponse>('/api/auth/login', { usuario, senha }).then(r => r.data),

  switchProfile: (perfilId: number) =>
    api.post<LoginResponse>('/api/auth/switch-profile', null, { params: { perfilId } }).then(r => r.data),
}
