import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

let _perfilId: number | null = null
let _token: string | null = null

export function setupAxiosInterceptors(perfilId: number | null, token: string | null = null) {
  _perfilId = perfilId
  _token = token
}

api.interceptors.request.use((config) => {
  if (_perfilId !== null) config.headers['X-Perfil-Id'] = String(_perfilId)
  if (_token) config.headers['Authorization'] = `Bearer ${_token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    const status = err.response?.status
    if (status === 401 || status === 403) {
      // Token expirado ou inválido — redirecionar para login
      localStorage.removeItem('mf_auth')
      localStorage.removeItem('activeProfile')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
