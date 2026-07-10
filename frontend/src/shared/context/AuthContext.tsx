import React, { createContext, useContext, useState, useCallback } from 'react'

interface AuthState {
  token: string | null
  perfilId: number | null
  perfilNome: string | null
}

export interface AuthContextValue extends AuthState {
  login: (token: string, perfilId: number, perfilNome: string) => void
  logout: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'mf_auth'

function loadFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  // TEMP: admin default pra testes
  return { token: 'fake-admin-token', perfilId: 1, perfilNome: 'Admin' }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loadFromStorage)

  const login = useCallback((token: string, perfilId: number, perfilNome: string) => {
    const next = { token, perfilId, perfilNome }
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const logout = useCallback(() => {
    setState({ token: null, perfilId: null, perfilNome: null })
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('activeProfile')
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAuthenticated: !!state.token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
