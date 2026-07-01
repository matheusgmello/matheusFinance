import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { perfisApi, Perfil } from '../../api/perfis'
import { useProfile } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import {
  Check, Trash2, Plus, WifiOff, Download, Upload,
  AlertTriangle, X, ShieldAlert, Bell, BellOff,
} from 'lucide-react'
import { pushApi } from '../../api/push'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">
      {children}
    </h2>
  )
}

function SettingsCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  )
}

function PushSection() {
  const [status, setStatus] = useState<'idle' | 'subscribed' | 'denied' | 'unsupported'>('idle')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    setLoading(true)
    try {
      const vapidKey = await pushApi.vapidPublicKey()
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm === 'denied') { setStatus('denied'); setLoading(false); return }

      if (vapidKey) {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        })
        await pushApi.subscribe(sub.toJSON() as PushSubscriptionJSON)
      }
      setStatus('subscribed')
      setMsg('Notificações ativadas neste dispositivo!')
    } catch (e: any) {
      setMsg('Erro ao ativar: ' + (e?.message ?? String(e)))
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await pushApi.unsubscribe(sub.endpoint)
        await sub.unsubscribe()
      }
      setStatus('idle')
      setMsg('Notificações desativadas.')
    } catch {
      setMsg('Erro ao desativar.')
    } finally {
      setLoading(false)
    }
  }

  const supported = 'serviceWorker' in navigator && 'PushManager' in window

  return (
    <section>
      <SectionTitle>Notificações Push</SectionTitle>
      <SettingsCard>
        <div className="p-5 flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            status === 'subscribed'
              ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
          }`}>
            {status === 'subscribed' ? <Bell size={20} /> : <BellOff size={20} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
              Alertas no dispositivo
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Receba notificações de alertas de preço e proventos mesmo com o app fechado.
              {!supported && ' (Não suportado neste navegador)'}
            </p>
            {msg && <p className="text-xs mt-1.5 text-accent-600 dark:text-accent-400">{msg}</p>}
            {status === 'denied' && (
              <p className="text-xs mt-1 text-rose-500">Permissão negada. Habilite nas configurações do navegador.</p>
            )}
          </div>
          <button
            onClick={status === 'subscribed' ? unsubscribe : subscribe}
            disabled={loading || !supported}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
              status === 'subscribed'
                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                : 'bg-accent-500 hover:bg-accent-600 text-white'
            }`}
          >
            {loading ? '…' : status === 'subscribed' ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      </SettingsCard>
    </section>
  )
}

export default function ConfiguracoesPage() {
  const { activeProfile, setActiveProfile } = useProfile()
  const { perfilId, perfilNome } = useAuth()
  const qc = useQueryClient()

  const [nome, setNome] = useState('')
  const [criarErro, setCriarErro] = useState('')
  const [importErro, setImportErro] = useState('')
  const [importOk, setImportOk] = useState('')
  const [exportandoId, setExportandoId] = useState<number | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const { data: perfis = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['perfis'],
    queryFn: perfisApi.listar,
    retry: 1,
  })

  useEffect(() => {
    if (perfis.length === 1 && !activeProfile) setActiveProfile(perfis[0])
  }, [perfis, activeProfile, setActiveProfile])

  const criar = useMutation({
    mutationFn: () => perfisApi.criar(nome),
    onSuccess: (novo) => {
      qc.invalidateQueries({ queryKey: ['perfis'] })
      setNome('')
      setCriarErro('')
      setActiveProfile(novo)
    },
    onError: (err: any) => {
      setCriarErro(err?.response?.data?.message ?? err?.message ?? 'Não foi possível conectar ao backend.')
    },
  })

  const deletarPerfil = useMutation({
    mutationFn: (id: number) => perfisApi.deletar(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['perfis'] })
      if (activeProfile?.id === id) setActiveProfile(null)
    },
  })

  const importar = useMutation({
    mutationFn: (file: File) => perfisApi.importar(file),
    onSuccess: (novo) => {
      qc.invalidateQueries({ queryKey: ['perfis'] })
      setActiveProfile(novo)
      setImportOk(`Perfil "${novo.nome}" importado com sucesso!`)
      setImportErro('')
      if (importRef.current) importRef.current.value = ''
    },
    onError: (err: any) => {
      setImportErro(err?.response?.data?.message ?? err?.message ?? 'Erro ao importar.')
      setImportOk('')
    },
  })

  const handleExportar = async (id: number, nomePerfil: string) => {
    setExportandoId(id)
    try { await perfisApi.exportar(id, nomePerfil) }
    finally { setExportandoId(null) }
  }

  const [showLimpar, setShowLimpar] = useState(false)
  const [limparError, setLimparError] = useState('')

  const limpar = useMutation({
    mutationFn: () => perfisApi.limparDados(perfilId!),
    onSuccess: () => {
      qc.clear()
      setShowLimpar(false)
      setLimparError('')
    },
    onError: (err: any) => {
      setLimparError(err?.response?.data?.message ?? 'Erro ao limpar dados.')
    },
  })

  return (
    <div className="p-6 md:p-8 space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Configurações</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Gerencie seus perfis e dados</p>
      </div>

      {/* ── Perfis ────────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Perfis</SectionTitle>

        {isError && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 mb-4">
            <WifiOff size={16} className="text-rose-500 flex-shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-300 flex-1">
              Backend inacessível —{' '}
              <span className="font-mono text-xs">http://localhost:8085</span>
            </p>
            <button onClick={() => refetch()} className="text-xs font-semibold text-rose-600 dark:text-rose-400 underline whitespace-nowrap">
              Tentar novamente
            </button>
          </div>
        )}

        <SettingsCard>
          {/* Criar novo perfil */}
          <div className="p-5 border-b border-gray-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Novo perfil</p>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do perfil"
                value={nome}
                onChange={e => { setNome(e.target.value); setCriarErro('') }}
                onKeyDown={e => e.key === 'Enter' && nome.trim() && criar.mutate()}
                className="flex-1"
              />
              <Button onClick={() => criar.mutate()} disabled={!nome.trim() || criar.isPending}>
                <Plus size={15} className="inline mr-1" />
                {criar.isPending ? 'Criando…' : 'Criar'}
              </Button>
            </div>
            {criarErro && <p className="text-xs text-rose-500 mt-2">{criarErro}</p>}
          </div>

          {/* Lista de perfis */}
          {isLoading ? (
            <div className="p-5">
              <p className="text-sm text-gray-400 dark:text-slate-500">Carregando…</p>
            </div>
          ) : perfis.length === 0 ? (
            <div className="p-5">
              <p className="text-sm text-gray-400 dark:text-slate-500">Nenhum perfil criado ainda.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {perfis.map((p: Perfil) => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-accent-500/15 flex items-center justify-center text-accent-600 dark:text-accent-400 font-bold text-base flex-shrink-0">
                    {p.nome.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-slate-100 truncate">{p.nome}</span>
                      {activeProfile?.id === p.id && <Badge color="accent">Ativo</Badge>}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-slate-500">ID #{p.id}</span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {activeProfile?.id !== p.id && (
                      <Button variant="primary" onClick={() => setActiveProfile(p)}>
                        <Check size={13} className="inline mr-1" /> Usar
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => handleExportar(p.id, p.nome)} disabled={exportandoId === p.id} title="Exportar backup">
                      <Download size={14} />
                    </Button>
                    <Button variant="danger" onClick={() => deletarPerfil.mutate(p.id)} disabled={deletarPerfil.isPending}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Importar */}
          <div className="p-5 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Importar perfil</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                Restaura um backup <span className="font-mono">.json</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button variant="ghost" onClick={() => { setImportErro(''); setImportOk(''); importRef.current?.click() }} disabled={importar.isPending}>
                <Upload size={14} className="inline mr-1.5" />
                {importar.isPending ? 'Importando…' : 'Selecionar arquivo'}
              </Button>
              <input ref={importRef} type="file" accept=".json" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) importar.mutate(f) }} />
            </div>
          </div>
          {(importOk || importErro) && (
            <p className={`px-5 pb-4 text-xs ${importOk ? 'text-accent-600 dark:text-accent-400' : 'text-rose-500'}`}>
              {importOk || importErro}
            </p>
          )}
        </SettingsCard>
      </section>

      {/* ── Zona de Perigo ────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Zona de perigo</SectionTitle>
        <SettingsCard className="border-rose-200 dark:border-rose-800/60">
          <div className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Limpar dados do perfil</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Apaga permanentemente todos os dados de{' '}
                <strong className="text-gray-700 dark:text-slate-300">{perfilNome ?? activeProfile?.nome ?? 'este perfil'}</strong>.
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => { setShowLimpar(true); setLimparError('') }}
              className="flex-shrink-0"
            >
              <Trash2 size={14} className="inline mr-1.5" />
              Limpar dados
            </Button>
          </div>
        </SettingsCard>
      </section>

      {/* Modal Limpar Dados */}
      {showLimpar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-rose-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Limpar Dados</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <button onClick={() => setShowLimpar(false)} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              Todos os dados do perfil <strong>{perfilNome}</strong> serão apagados permanentemente:
              compras, cartões, recorrentes, investimentos, metas, alertas e histórico.
            </p>
            {limparError && <p className="text-xs text-rose-500">{limparError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowLimpar(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => limpar.mutate()}
                disabled={limpar.isPending}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {limpar.isPending ? 'Limpando…' : 'Sim, apagar tudo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificações push */}
      <PushSection />
    </div>
  )
}
