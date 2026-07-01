import { api } from './axios'

export interface LoginResponse {
  token: string
  perfilId: number
  perfilNome: string
}

export const authApi = {
  register: (email: string, nome: string, senha: string, confirmarSenha: string) =>
    api.post<LoginResponse>('/api/auth/register', { email, nome, senha, confirmarSenha }).then(r => r.data),

  login: (email: string, senha: string) =>
    api.post<LoginResponse>('/api/auth/login', { email, senha }).then(r => r.data),

  switchProfile: (perfilId: number) =>
    api.post<LoginResponse>('/api/auth/switch-profile', null, { params: { perfilId } }).then(r => r.data),
}
