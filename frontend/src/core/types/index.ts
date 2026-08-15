// Auth
export interface LoginResponse {
  token: string
  perfilId: number
  perfilNome: string
}

// Profile
export interface Profile {
  id: number
  nome: string
  criadoEm: string
}
