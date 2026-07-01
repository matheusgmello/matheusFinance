import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../context/ProfileContext'
import { setupAxiosInterceptors } from '../../api/axios'
import { Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { setActiveProfile } = useProfile()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  const loginMut = useMutation({
    mutationFn: () => authApi.login(email, senha),
    onSuccess: (data) => {
      login(data.token, data.perfilId, data.perfilNome)
      setActiveProfile({ id: data.perfilId, nome: data.perfilNome, criadoEm: '' })
      setupAxiosInterceptors(data.perfilId, data.token)
      navigate('/', { replace: true })
    },
    onError: (e: any) => setErro(e?.response?.data?.detail ?? 'E-mail ou senha incorretos.'),
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-accent-500 font-bold text-2xl tracking-tight">
            matheus<span className="text-gray-900 dark:text-slate-100">Finance</span>
          </span>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Controle financeiro pessoal</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Entrar</h2>

          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErro('') }}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro('') }}
              onKeyDown={e => e.key === 'Enter' && loginMut.mutate()}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          {erro && <p className="text-sm text-rose-500 text-center">{erro}</p>}

          <button
            onClick={() => loginMut.mutate()}
            disabled={loginMut.isPending || !email || !senha}
            className="w-full py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
          >
            {loginMut.isPending ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400 pt-1">
            Não tem conta?{' '}
            <Link to="/register" className="text-accent-600 dark:text-accent-400 font-medium hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
