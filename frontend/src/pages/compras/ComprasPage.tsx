import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { comprasApi, Compra, CompraRequest } from '../../domains/compra/api'
import { cartoesApi, Cartao } from '../../domains/cartao/api'
import { useProfile } from '../../shared/context/ProfileContext'
import { Card, Button, Input, PageHeader, Badge, CategoriaSelect } from '../../shared/components/ui'
import { Trash2, Plus, X, ChevronDown, ChevronUp, Pencil, AlertTriangle, Search } from 'lucide-react'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const SELECT_CLS = 'bg-bg-elevated border border-c-border rounded-xl px-3 py-2 text-sm text-c-primary focus:outline-none focus:ring-1 focus:ring-accent-500'

function CompraForm({ cartoes, onClose, editando }: { cartoes: Cartao[]; onClose: () => void; editando?: Compra }) {
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<CompraRequest>(
    editando
      ? {
          cartaoId: editando.cartaoId,
          descricao: editando.descricao,
          valorTotal: editando.valorTotal,
          numParcelas: editando.numParcelas,
          dataCompra: editando.dataCompra,
          categoria: editando.categoria ?? '',
        }
      : { cartaoId: cartoes[0]?.id ?? 0, descricao: '', valorTotal: 0, numParcelas: 1, dataCompra: today, categoria: '' }
  )
  const [erro, setErro] = useState('')
  const salvar = useMutation({
    mutationFn: () => editando
      ? comprasApi.atualizar(editando.id, form)
      : comprasApi.criar(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compras'] }); onClose() },
    onError: (e: any) => setErro(e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Erro ao salvar compra.'),
  })
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-c-primary">{editando ? 'Editar Compra' : 'Nova Compra Parcelada'}</h2>
        <button onClick={onClose} className="text-c-muted hover:text-c-primary"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-c-muted">Cartão</label>
          <select value={form.cartaoId} onChange={e => setForm(f => ({ ...f, cartaoId: Number(e.target.value) }))} className={SELECT_CLS}>
            {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <Input label="Descrição" value={form.descricao} onChange={e => { setForm(f => ({ ...f, descricao: e.target.value })); setErro('') }} placeholder="Ex: TV 4K" />
        <Input label="Valor Total (R$)" type="number" step="0.01" min={0.01} value={form.valorTotal}
          onChange={e => setForm(f => ({ ...f, valorTotal: Number(e.target.value) }))} />
        <Input label="Nº de Parcelas" type="number" min={1} max={360} value={form.numParcelas}
          onChange={e => setForm(f => ({ ...f, numParcelas: Number(e.target.value) }))} />
        <Input label="Data da Compra" type="date" value={form.dataCompra}
          onChange={e => setForm(f => ({ ...f, dataCompra: e.target.value }))} />
        <CategoriaSelect value={form.categoria ?? ''} onChange={v => setForm(f => ({ ...f, categoria: v }))} />
      </div>
      {editando && (
        <p className="text-xs text-due mt-3 flex items-center gap-1">
          <AlertTriangle size={12} /> As parcelas serão recalculadas com os novos valores.
        </p>
      )}
      {erro && <p className="text-xs text-overdue mt-2">{erro}</p>}
      <div className="flex justify-end mt-4">
        <Button onClick={() => salvar.mutate()} disabled={!form.descricao.trim() || !form.cartaoId || salvar.isPending}>
          {salvar.isPending ? 'Salvando…' : editando ? 'Atualizar Compra' : 'Registrar Compra'}
        </Button>
      </div>
    </Card>
  )
}

function CompraRow({ compra, onDelete, onEdit }: { compra: Compra; onDelete: () => void; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const vencAtual = compra.parcelas.find(p => !p.paga)
  const pagas = compra.parcelas.filter(p => p.paga).length
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-c-primary">{compra.descricao}</p>
            {compra.categoria && <Badge>{compra.categoria}</Badge>}
          </div>
          <p className="text-sm text-c-muted mt-1">{compra.cartaoNome} · {compra.numParcelas}x {BRL(compra.valorTotal / compra.numParcelas)}</p>
          <p className="text-xs text-c-muted mt-0.5">
            Total: {BRL(compra.valorTotal)} · {pagas}/{compra.numParcelas} pagas
          </p>
          {vencAtual && (
            <p className="text-xs text-due mt-1">
              Próxima: {BRL(vencAtual.valor)} em {new Date(vencAtual.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-4">
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-c-muted hover:text-c-primary rounded-full">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button onClick={onEdit} className="p-1.5 text-c-muted hover:text-accent-500 transition rounded-full hover:bg-accent-500/10">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-c-muted hover:text-overdue transition rounded-full hover:bg-overdue/10">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-4 border-t border-c-border pt-4">
          <p className="text-xs text-c-muted mb-2 font-medium uppercase tracking-wide">Parcelas</p>
          <div className="space-y-1">
            {compra.parcelas.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-c-muted">
                  {p.numero}/{compra.numParcelas} — {new Date(p.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-c-primary tabular-nums">{BRL(p.valor)}</span>
                  <Badge color={p.paga ? 'accent' : 'slate'}>{p.paga ? 'Paga' : 'Pendente'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export default function ComprasPage() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Compra | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'pendentes' | 'quitadas'>('todas')

  const { data: compras = [], isLoading } = useQuery({
    queryKey: ['compras', activeProfile?.id],
    queryFn: comprasApi.listar,
    enabled: !!activeProfile,
  })
  const { data: cartoes = [] } = useQuery({
    queryKey: ['cartoes', activeProfile?.id],
    queryFn: cartoesApi.listar,
    enabled: !!activeProfile,
  })
  const deletar = useMutation({
    mutationFn: (id: number) => comprasApi.deletar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compras'] }),
  })

  function abrirEdicao(c: Compra) {
    setShowForm(false)
    setEditando(c)
  }
  function fecharForm() {
    setShowForm(false)
    setEditando(null)
  }

  const comprasFiltradas = compras.filter((c: Compra) => {
    const termo = busca.toLowerCase()
    const matchBusca = !termo ||
      c.descricao.toLowerCase().includes(termo) ||
      c.cartaoNome.toLowerCase().includes(termo) ||
      (c.categoria ?? '').toLowerCase().includes(termo)
    const todasPagas = c.parcelas.every(p => p.paga)
    const matchStatus =
      filtroStatus === 'todas' ? true :
      filtroStatus === 'quitadas' ? todasPagas :
      !todasPagas
    return matchBusca && matchStatus
  })

  if (!activeProfile) {
    return <div><Card><p className="text-c-muted">Selecione um perfil primeiro.</p></Card></div>
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Compras Parceladas"
        subtitle="Acompanhe suas compras parceladas no cartão"
        actions={
          <Button onClick={() => { setShowForm(s => !s); setEditando(null) }} disabled={cartoes.length === 0}>
            <Plus size={14} className="inline mr-1" />Nova Compra
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-c-muted" />
          <input
            type="text"
            placeholder="Buscar por descrição, cartão ou categoria…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-bg-elevated border border-c-border rounded-xl pl-9 pr-9 py-2 text-sm text-c-primary focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-c-muted hover:text-c-primary">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-bg-elevated rounded-xl p-1 border border-c-border">
          {(['todas', 'pendentes', 'quitadas'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide transition-colors ${
                filtroStatus === s
                  ? 'bg-bg-card text-c-primary'
                  : 'text-c-muted hover:text-c-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {cartoes.length === 0 && (
        <Card><p className="text-c-muted text-sm">Cadastre ao menos um cartão (aba Cartões) antes de registrar compras.</p></Card>
      )}
      {showForm && <CompraForm cartoes={cartoes} onClose={fecharForm} />}
      {editando && <CompraForm cartoes={cartoes} onClose={fecharForm} editando={editando} />}
      {isLoading ? (
        <p className="text-c-muted">Carregando…</p>
      ) : compras.length === 0 ? (
        <Card><p className="text-c-muted">Nenhuma compra parcelada registrada.</p></Card>
      ) : comprasFiltradas.length === 0 ? (
        <Card><p className="text-c-muted text-sm">Nenhuma compra encontrada para "{busca || filtroStatus}".</p></Card>
      ) : (
        <div className="space-y-4">
          {comprasFiltradas.map((c: Compra) => (
            <CompraRow
              key={c.id}
              compra={c}
              onDelete={() => deletar.mutate(c.id)}
              onEdit={() => abrirEdicao(c)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
