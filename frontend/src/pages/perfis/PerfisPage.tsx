import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { perfisApi, Perfil } from '../../api/perfis'
import { useProfile } from '../../context/ProfileContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Check, Trash2, Plus, WifiOff, Download, Upload } from 'lucide-react'

export default function PerfisPage() {
  const { activeProfile, setActiveProfile } = useProfile()
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

  // Seleciona automaticamente o único perfil disponível
  useEffect(() => {
    if (perfis.length === 1 && !activeProfile) {
      setActiveProfile(perfis[0])
    }
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
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Não foi possível conectar ao backend. Verifique se o servidor está rodando.'
      setCriarErro(msg)
    },
  })

  const deletar = useMutation({
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
      setImportErro(err?.response?.data?.message ?? err?.message ?? 'Erro ao importar o perfil.')
      setImportOk('')
    },
  })

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) importar.mutate(file)
  }

  const handleExportar = async (id: number, nome: string) => {
    setExportandoId(id)
    try {
      await perfisApi.exportar(id, nome)
    } finally {
      setExportandoId(null)
    }
  }

  const handleCriar = () => {
    setCriarErro('')
    criar.mutate()
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Perfis" subtitle="Gerencie seus perfis locais" />

      {/* Erro de conexão */}
      {isError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
          <WifiOff size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              Backend inacessível
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
              Não foi possível conectar ao servidor em{' '}
              <span className="font-mono">http://localhost:8085</span>.
              Execute <span className="font-mono">start.bat</span> e aguarde o Spring Boot subir (~20s).
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs font-medium text-rose-600 dark:text-rose-400 underline whitespace-nowrap"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Formulário de criação */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Novo Perfil</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Nome do perfil"
            value={nome}
            onChange={e => { setNome(e.target.value); setCriarErro('') }}
            onKeyDown={e => e.key === 'Enter' && nome.trim() && handleCriar()}
            className="flex-1"
          />
          <Button
            onClick={handleCriar}
            disabled={!nome.trim() || criar.isPending}
          >
            <Plus size={16} className="inline mr-1" />
            {criar.isPending ? 'Criando…' : 'Criar'}
          </Button>
        </div>
        {criarErro && (
          <p className="text-xs text-rose-500 dark:text-rose-400 mt-2">{criarErro}</p>
        )}
      </Card>

      {/* Importar perfil */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Importar Perfil</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
          Restaura um perfil completo (cartões, compras, recorrentes e investimentos) a partir de um arquivo de backup <span className="font-mono">.json</span>.
        </p>
        <Button
          variant="ghost"
          onClick={() => { setImportErro(''); setImportOk(''); importRef.current?.click() }}
          disabled={importar.isPending}
        >
          <Upload size={15} className="inline mr-1.5" />
          {importar.isPending ? 'Importando…' : 'Selecionar arquivo .json'}
        </Button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        {importOk && (
          <p className="text-xs text-accent-600 dark:text-accent-400 mt-2">{importOk}</p>
        )}
        {importErro && (
          <p className="text-xs text-rose-500 dark:text-rose-400 mt-2">{importErro}</p>
        )}
      </Card>

      {/* Lista de perfis */}
      <Card>
        {isLoading ? (
          <p className="text-gray-500 dark:text-slate-400 text-sm">Carregando…</p>
        ) : isError ? (
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            Não foi possível carregar os perfis.
          </p>
        ) : perfis.length === 0 ? (
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            Nenhum perfil criado ainda. Crie um acima.
          </p>
        ) : (
          <ul className="space-y-2">
            {perfis.map((p: Perfil) => (
              <li
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-600 dark:text-accent-400 font-bold flex-shrink-0">
                    {p.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{p.nome}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">ID #{p.id}</p>
                  </div>
                  {activeProfile?.id === p.id && <Badge color="accent">Ativo</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeProfile?.id === p.id ? 'ghost' : 'primary'}
                    onClick={() => setActiveProfile(p)}
                  >
                    <Check size={14} className="inline mr-1" />
                    {activeProfile?.id === p.id ? 'Selecionado' : 'Selecionar'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleExportar(p.id, p.nome)}
                    disabled={exportandoId === p.id}
                    title="Exportar backup"
                  >
                    <Download size={14} />
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => deletar.mutate(p.id)}
                    disabled={deletar.isPending}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
