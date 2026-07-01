import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { comprasApi, Compra, CompraRequest } from '../../api/compras'
import { cartoesApi, Cartao } from '../../api/cartoes'
import { useProfile } from '../../context/ProfileContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Trash2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function CompraForm({ cartoes, onClose }: { cartoes: Cartao[]; onClose: () => void }) {
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<CompraRequest>({
    cartaoId: cartoes[0]?.id ?? 0,
    descricao: '',
    valorTotal: 0,
    numParcelas: 1,
    dataCompra: today,
    categoria: '',
  })

  const criar = useMutation({
    mutationFn: () => comprasApi.criar(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compras'] }); onClose() },
  })

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-100">Nova Compra Parcelada</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">Cartão</label>
          <select
            value={form.cartaoId}
            onChange={e => setForm(f => ({ ...f, cartaoId: Number(e.target.value) }))}
            className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <Input label="Descrição" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: TV 4K" />
        <Input label="Valor Total (R$)" type="number" step="0.01" min={0.01} value={form.valorTotal}
          onChange={e => setForm(f => ({ ...f, valorTotal: Number(e.target.value) }))} />
        <Input label="Nº de Parcelas" type="number" min={1} max={360} value={form.numParcelas}
          onChange={e => setForm(f => ({ ...f, numParcelas: Number(e.target.value) }))} />
        <Input label="Data da Compra" type="date" value={form.dataCompra}
          onChange={e => setForm(f => ({ ...f, dataCompra: e.target.value }))} />
        <Input label="Categoria (opcional)" value={form.categoria ?? ''} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="Ex: Eletrônicos" />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={() => criar.mutate()} disabled={!form.descricao.trim() || !form.cartaoId || criar.isPending}>
          Registrar Compra
        </Button>
      </div>
    </Card>
  )
}

function CompraCard({ compra, onDelete }: { compra: Compra; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const vencAtual = compra.parcelas.find(p => !p.paga)
  const pagas = compra.parcelas.filter(p => p.paga).length

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-100">{compra.descricao}</p>
            {compra.categoria && <Badge>{compra.categoria}</Badge>}
          </div>
          <p className="text-sm text-slate-400 mt-1">{compra.cartaoNome} · {compra.numParcelas}x {BRL(compra.valorTotal / compra.numParcelas)}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Total: {BRL(compra.valorTotal)} · {pagas}/{compra.numParcelas} pagas
          </p>
          {vencAtual && (
            <p className="text-xs text-amber-400 mt-1">
              Próxima parcela: {BRL(vencAtual.valor)} em{' '}
              {new Date(vencAtual.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button onClick={() => setExpanded(e => !e)} className="text-slate-500 hover:text-slate-300">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={onDelete} className="text-slate-600 hover:text-rose-400 transition">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-slate-700 pt-4">
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Parcelas</p>
          <div className="space-y-1">
            {compra.parcelas.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {p.numero}/{compra.numParcelas} —{' '}
                  {new Date(p.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-200">{BRL(p.valor)}</span>
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

  if (!activeProfile) {
    return <div className="p-6"><Card><p className="text-slate-400">Selecione um perfil primeiro.</p></Card></div>
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Compras Parceladas"
        subtitle="Acompanhe suas compras parceladas no cartão"
        actions={
          <Button onClick={() => setShowForm(s => !s)} disabled={cartoes.length === 0}>
            <Plus size={16} className="inline mr-1" />Nova Compra
          </Button>
        }
      />

      {cartoes.length === 0 && (
        <Card>
          <p className="text-slate-400 text-sm">Cadastre ao menos um cartão antes de registrar compras.</p>
        </Card>
      )}

      {showForm && <CompraForm cartoes={cartoes} onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-slate-400">Carregando…</p>
      ) : compras.length === 0 ? (
        <Card><p className="text-slate-500">Nenhuma compra parcelada registrada.</p></Card>
      ) : (
        <div className="space-y-4">
          {compras.map((c: Compra) => (
            <CompraCard key={c.id} compra={c} onDelete={() => deletar.mutate(c.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
