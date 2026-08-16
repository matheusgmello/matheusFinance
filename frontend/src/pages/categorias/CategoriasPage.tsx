import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriasApi, CORES, Categoria, Cor } from '../../domains/configuracao/api'
import { useProfile } from '../../shared/context/ProfileContext'
import { Card, Button, Input, PageHeader } from '../../shared/components/ui'
import { Plus, X, Trash2, Pencil, Check } from 'lucide-react'

const dot = (cor: string) => CORES.find(c => c.value === cor)?.tw ?? 'bg-neutral'

function CoresPicker({ value, onChange }: { value: Cor; onChange: (c: Cor) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CORES.map(c => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => onChange(c.value)}
          className={`w-6 h-6 rounded-full ${c.tw} transition ring-offset-2 ring-offset-bg-card ${value === c.value ? 'ring-2 ring-accent-500' : 'hover:scale-110'}`}
        />
      ))}
    </div>
  )
}

function CategoriaRow({ cat, onDelete }: { cat: Categoria; onDelete: () => void }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [nome, setNome] = useState(cat.nome)
  const [cor, setCor] = useState<Cor>(cat.cor)
  const [erro, setErro] = useState('')

  const atualizar = useMutation({
    mutationFn: () => categoriasApi.atualizar(cat.id, { nome, cor }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); setEditing(false); setErro('') },
    onError: (e: any) => setErro(e?.response?.data?.message ?? 'Erro ao atualizar.'),
  })

  if (editing) {
    return (
      <li className="p-4 rounded-xl bg-bg-elevated border border-c-border space-y-3">
        <div className="flex gap-3">
          <Input value={nome} onChange={e => { setNome(e.target.value); setErro('') }} placeholder="Nome da categoria" className="flex-1" />
          <button onClick={() => atualizar.mutate()} disabled={!nome.trim() || atualizar.isPending} className="text-paid hover:brightness-110 disabled:opacity-40">
            <Check size={18} />
          </button>
          <button onClick={() => { setEditing(false); setNome(cat.nome); setCor(cat.cor) }} className="text-c-muted hover:text-c-primary">
            <X size={18} />
          </button>
        </div>
        <CoresPicker value={cor} onChange={setCor} />
        {erro && <p className="text-xs text-overdue">{erro}</p>}
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between p-4 rounded-xl bg-bg-elevated border border-c-border">
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot(cat.cor)}`} />
        <span className="font-medium text-c-primary">{cat.nome}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(true)} className="text-c-muted hover:text-c-primary transition">
          <Pencil size={15} />
        </button>
        <button onClick={onDelete} className="text-c-muted hover:text-overdue transition">
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  )
}

export default function CategoriasPage() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState<Cor>('emerald')
  const [erro, setErro] = useState('')

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['categorias', activeProfile?.id],
    queryFn: categoriasApi.listar,
    enabled: !!activeProfile,
  })

  const criar = useMutation({
    mutationFn: () => categoriasApi.criar({ nome, cor }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] })
      setNome('')
      setCor('emerald')
      setShowForm(false)
      setErro('')
    },
    onError: (e: any) => setErro(e?.response?.data?.message ?? 'Erro ao criar categoria.'),
  })

  const deletar = useMutation({
    mutationFn: (id: number) => categoriasApi.deletar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })

  if (!activeProfile) {
    return <div><Card><p className="text-c-muted">Selecione um perfil primeiro.</p></Card></div>
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Categorias"
        subtitle="Organize compras e recorrentes"
        actions={<Button onClick={() => { setShowForm(s => !s); setErro('') }}><Plus size={14} className="inline mr-1" />Nova Categoria</Button>}
      />

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-c-primary">Nova Categoria</h2>
            <button onClick={() => setShowForm(false)} className="text-c-muted hover:text-c-primary"><X size={18} /></button>
          </div>
          <div className="space-y-4">
            <Input
              label="Nome"
              value={nome}
              onChange={e => { setNome(e.target.value); setErro('') }}
              placeholder="Ex: Alimentação"
              onKeyDown={e => e.key === 'Enter' && nome.trim() && criar.mutate()}
            />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-c-muted block mb-2">Cor</label>
              <CoresPicker value={cor} onChange={setCor} />
            </div>
            {erro && <p className="text-xs text-overdue">{erro}</p>}
            <div className="flex justify-end">
              <Button onClick={() => criar.mutate()} disabled={!nome.trim() || criar.isPending}>Salvar</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <p className="text-c-muted text-sm">Carregando…</p>
        ) : categorias.length === 0 ? (
          <p className="text-c-muted text-sm">
            Nenhuma categoria criada. Crie categorias para organizar compras e recorrentes.
          </p>
        ) : (
          <ul className="space-y-2">
            {categorias.map(c => (
              <CategoriaRow key={c.id} cat={c} onDelete={() => deletar.mutate(c.id)} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
