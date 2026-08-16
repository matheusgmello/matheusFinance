import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../domains/auth/api'
import { useAuth } from '../../shared/context/AuthContext'
import { useProfile } from '../../shared/context/ProfileContext'
import { setupAxiosInterceptors } from '../../core/api/axios'
import { Lock, User } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { setActiveProfile } = useProfile()

  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  const loginMut = useMutation({
    mutationFn: () => authApi.login(usuario, senha),
    onSuccess: (data) => {
      login(data.token, data.perfilId, data.perfilNome)
      setActiveProfile({ id: data.perfilId, nome: data.perfilNome, criadoEm: '' })
      setupAxiosInterceptors(data.perfilId, data.token)
      navigate('/', { replace: true })
    },
    onError: (e: any) => setErro(e?.response?.data?.detail ?? 'Usuário ou senha incorretos.'),
  })

  return (
    <div className="min-h-screen bg-bg-body flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-accent-500" />
          <span className="font-semibold text-lg tracking-wide text-c-primary">
            SLOPFINANCE
          </span>
          <p className="text-xs text-c-muted uppercase tracking-widest">Controle financeiro pessoal</p>
        </div>

        <div className="bg-bg-card rounded-xl border border-c-border p-6 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-c-muted mb-1">Entrar</h2>

          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-c-muted" />
            <input
              type="text"
              placeholder="Usuário"
              value={usuario}
              onChange={e => { setUsuario(e.target.value); setErro('') }}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-c-border rounded-xl bg-bg-elevated text-c-primary focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-c-muted" />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro('') }}
              onKeyDown={e => e.key === 'Enter' && loginMut.mutate()}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-c-border rounded-xl bg-bg-elevated text-c-primary focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>

          {erro && <p className="text-sm text-overdue text-center">{erro}</p>}

          <button
            onClick={() => loginMut.mutate()}
            disabled={loginMut.isPending || !usuario || !senha}
            className="w-full py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider transition-colors"
          >
            {loginMut.isPending ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-c-muted pt-1">
            Não tem conta?{' '}
            <Link to="/register" className="text-accent-500 font-medium hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
