import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../context/ProfileContext'
import { setupAxiosInterceptors } from '../../api/axios'
import { UserPlus, Mail, Lock, User } from 'lucide-react'

const INPUT_CLS = `w-full px-10 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl
  bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm
  focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder-gray-400 dark:placeholder-slate-500`

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { setActiveProfile } = useProfile()

  const [nome,           setNome]           = useState('')
  const [email,          setEmail]          = useState('')
  const [senha,          setSenha]          = useState('')
  const [confirmar,      setConfirmar]      = useState('')
  const [erro,           setErro]           = useState('')

  const mutation = useMutation({
    mutationFn: () => authApi.register(email, nome, senha, confirmar),
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
    if (!nome.trim()) return setErro('Informe seu nome.')
    if (!email.includes('@')) return setErro('E-mail inválido.')
    if (senha.length < 6) return setErro('A senha deve ter no mínimo 6 caracteres.')
    if (senha !== confirmar) return setErro('As senhas não coincidem.')
    mutation.mutate()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-accent-500 font-bold text-2xl tracking-tight">
            matheus<span className="text-gray-900 dark:text-slate-100">Finance</span>
          </span>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Crie sua conta</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent-500/15 flex items-center justify-center">
              <UserPlus size={16} className="text-accent-600 dark:text-accent-400" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Criar conta</h2>
          </div>

          {/* Nome */}
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text" placeholder="Seu nome"
              value={nome} onChange={e => { setNome(e.target.value); setErro('') }}
              className={INPUT_CLS}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="email" placeholder="seu@email.com"
              value={email} onChange={e => { setEmail(e.target.value); setErro('') }}
              className={INPUT_CLS}
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="password" placeholder="Senha (mín. 6 caracteres)"
              value={senha} onChange={e => { setSenha(e.target.value); setErro('') }}
              className={INPUT_CLS}
            />
          </div>

          {/* Confirmar */}
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="password" placeholder="Confirmar senha"
              value={confirmar} onChange={e => { setConfirmar(e.target.value); setErro('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className={INPUT_CLS}
            />
          </div>

          {erro && (
            <p className="text-sm text-rose-500 text-center">{erro}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
          >
            {mutation.isPending ? 'Criando conta…' : 'Criar conta'}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            Já tem conta?{' '}
            <Link to="/login" className="text-accent-600 dark:text-accent-400 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
