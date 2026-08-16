import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../domains/auth/api'
import { useAuth } from '../../shared/context/AuthContext'
import { useProfile } from '../../shared/context/ProfileContext'
import { setupAxiosInterceptors } from '../../core/api/axios'
import { UserPlus, Lock, User } from 'lucide-react'

const INPUT_CLS = `w-full px-10 py-2.5 border border-c-border rounded-xl
  bg-bg-elevated text-c-primary text-sm
  focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500 placeholder-c-muted`

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { setActiveProfile } = useProfile()

  const [usuario,   setUsuario]   = useState('')
  const [senha,     setSenha]     = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro,      setErro]      = useState('')

  const mutation = useMutation({
    mutationFn: () => authApi.register(usuario, senha, confirmar),
    onSuccess: data => {
      login(data.token, data.perfilId, data.perfilNome)
      setActiveProfile({ id: data.perfilId, nome: data.perfilNome, criadoEm: '' })
      setupAxiosInterceptors(data.perfilId, data.token)
      navigate('/', { replace: true })
    },
    onError: (e: any) => {
      const status = e?.response?.status
      const data = e?.response?.data
      const msg = data?.detail ?? data?.message ?? e?.message ?? 'Erro ao criar conta.'
      setErro(status ? `[${status}] ${msg}` : msg)
    },
  })

  function handleSubmit() {
    setErro('')
    if (usuario.trim().length < 3) return setErro('Usuário deve ter no mínimo 3 caracteres.')
    if (senha.length < 6) return setErro('A senha deve ter no mínimo 6 caracteres.')
    if (senha !== confirmar) return setErro('As senhas não coincidem.')
    mutation.mutate()
  }

  return (
    <div className="min-h-screen bg-bg-body flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-accent-500" />
          <span className="font-semibold text-lg tracking-wide text-c-primary">
            SLOPFINANCE
          </span>
          <p className="text-xs text-c-muted uppercase tracking-widest">Crie sua conta</p>
        </div>

        <div className="bg-bg-card rounded-xl border border-c-border p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent-500/10 border border-accent-500/30 flex items-center justify-center">
              <UserPlus size={15} className="text-accent-500" />
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-c-muted">Criar conta</h2>
          </div>

          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-c-muted" />
            <input
              type="text" placeholder="Usuário"
              value={usuario} onChange={e => { setUsuario(e.target.value); setErro('') }}
              className={INPUT_CLS}
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-c-muted" />
            <input
              type="password" placeholder="Senha (mín. 6 caracteres)"
              value={senha} onChange={e => { setSenha(e.target.value); setErro('') }}
              className={INPUT_CLS}
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-c-muted" />
            <input
              type="password" placeholder="Confirmar senha"
              value={confirmar} onChange={e => { setConfirmar(e.target.value); setErro('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className={INPUT_CLS}
            />
          </div>

          {erro && <p className="text-sm text-overdue text-center">{erro}</p>}

          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider transition-colors"
          >
            {mutation.isPending ? 'Criando conta…' : 'Criar conta'}
          </button>

          <p className="text-center text-sm text-c-muted">
            Já tem conta?{' '}
            <Link to="/login" className="text-accent-500 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
