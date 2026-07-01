import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardApi, ConsolidadoMes } from '../../api/dashboard'
import { cartoesApi, Cartao, CartaoRequest } from '../../api/cartoes'
import { comprasApi, Compra, CompraRequest } from '../../api/compras'
import { recorrentesApi, RecorrenteRequest, ChecklistItem } from '../../api/recorrentes'
import { faturaApi, FaturaCartao } from '../../api/fatura'
import { orcamentosApi, Orcamento, OrcamentoRequest } from '../../api/orcamentos'
import { receitasApi } from '../../api/receitas'
import { perfisApi } from '../../api/perfis'
import { relatoriosApi } from '../../api/relatorios'
import { patrimonioApi } from '../../api/patrimonio'
import { categoriasApi, CORES, Categoria, Cor } from '../../api/categorias'
import { useProfile } from '../../context/ProfileContext'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { CategoriaSelect } from '../../components/ui/CategoriaSelect'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'
import {
  CreditCard, Trash2, Plus, X, ChevronDown, ChevronUp,
  CheckCircle, Circle, ChevronLeft, ChevronRight, Pencil, Check, Layers, Download, FileText, AlertTriangle,
} from 'lucide-react'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const PIE_COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#8b5cf6', '#ec4899']
const SELECT_CLS = 'bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500'

type Tab = 'Resumo' | 'Orçamentos' | 'Fatura' | 'Compras' | 'Cartões' | 'Recorrentes' | 'Relatórios' | 'Categorias'
const TABS: Tab[] = ['Resumo', 'Orçamentos', 'Fatura', 'Compras', 'Cartões', 'Recorrentes', 'Relatórios', 'Categorias']

// ─── Cartões ──────────────────────────────────────────────────────────────────
function CartaoForm({ onClose, editando }: { onClose: () => void; editando?: Cartao }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<CartaoRequest>(
    editando
      ? { nome: editando.nome, diaVencimento: editando.diaVencimento, diaFechamento: editando.diaFechamento }
      : { nome: '', diaVencimento: 10, diaFechamento: 3 }
  )
  const [erro, setErro] = useState('')
  const salvar = useMutation({
    mutationFn: () => editando
      ? cartoesApi.atualizar(editando.id, form)
      : cartoesApi.criar(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cartoes'] }); onClose() },
    onError: (e: any) => setErro(e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Erro ao salvar cartão.'),
  })
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-slate-100">{editando ? 'Editar Cartão' : 'Novo Cartão'}</h2>
        <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="Nome" value={form.nome} onChange={e => { setForm(f => ({ ...f, nome: e.target.value })); setErro('') }} placeholder="Ex: Nubank" />
        <Input label="Dia Vencimento" type="number" min={1} max={31} value={form.diaVencimento}
          onChange={e => setForm(f => ({ ...f, diaVencimento: Number(e.target.value) }))} />
        <Input label="Dia Fechamento" type="number" min={1} max={31} value={form.diaFechamento}
          onChange={e => setForm(f => ({ ...f, diaFechamento: Number(e.target.value) }))} />
      </div>
      {erro && <p className="text-xs text-rose-500 mt-3">{erro}</p>}
      <div className="flex justify-end mt-4">
        <Button onClick={() => salvar.mutate()} disabled={!form.nome.trim() || salvar.isPending}>
          {salvar.isPending ? 'Salvando…' : editando ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </Card>
  )
}

function CartoesTab() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Cartao | null>(null)
  const { data: cartoes = [], isLoading } = useQuery({
    queryKey: ['cartoes', activeProfile?.id],
    queryFn: cartoesApi.listar,
    enabled: !!activeProfile,
  })
  const deletar = useMutation({
    mutationFn: (id: number) => cartoesApi.deletar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cartoes'] }),
  })

  function abrirEdicao(c: Cartao) {
    setShowForm(false)
    setEditando(c)
  }
  function fecharForm() {
    setShowForm(false)
    setEditando(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setShowForm(s => !s); setEditando(null) }}>
          <Plus size={16} className="inline mr-1" />Novo Cartão
        </Button>
      </div>
      {showForm && <CartaoForm onClose={fecharForm} />}
      {editando && <CartaoForm onClose={fecharForm} editando={editando} />}
      {isLoading ? (
        <p className="text-gray-500 dark:text-slate-400">Carregando…</p>
      ) : cartoes.length === 0 ? (
        <Card><p className="text-gray-400 dark:text-slate-500">Nenhum cartão cadastrado.</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cartoes.map((c: Cartao) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-600 dark:text-accent-400">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{c.nome}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Venc. dia {c.diaVencimento} · Fecha dia {c.diaFechamento}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => abrirEdicao(c)} className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-accent-500 transition rounded-lg hover:bg-accent-50 dark:hover:bg-accent-900/10">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deletar.mutate(c.id)} className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-rose-500 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Compras ──────────────────────────────────────────────────────────────────
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
        <h2 className="font-semibold text-gray-900 dark:text-slate-100">{editando ? 'Editar Compra' : 'Nova Compra Parcelada'}</h2>
        <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Cartão</label>
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
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
          <AlertTriangle size={12} /> As parcelas serão recalculadas com os novos valores.
        </p>
      )}
      {erro && <p className="text-xs text-rose-500 mt-2">{erro}</p>}
      <div className="flex justify-end mt-4">
        <Button onClick={() => salvar.mutate()} disabled={!form.descricao.trim() || !form.cartaoId || salvar.isPending}>
          {salvar.isPending ? 'Salvando…' : editando ? 'Atualizar Compra' : 'Registrar Compra'}
        </Button>
      </div>
    </Card>
  )
}

function CompraCard({ compra, onDelete, onEdit }: { compra: Compra; onDelete: () => void; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const vencAtual = compra.parcelas.find(p => !p.paga)
  const pagas = compra.parcelas.filter(p => p.paga).length
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-slate-100">{compra.descricao}</p>
            {compra.categoria && <Badge>{compra.categoria}</Badge>}
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{compra.cartaoNome} · {compra.numParcelas}x {BRL(compra.valorTotal / compra.numParcelas)}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            Total: {BRL(compra.valorTotal)} · {pagas}/{compra.numParcelas} pagas
          </p>
          {vencAtual && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Próxima: {BRL(vencAtual.valor)} em {new Date(vencAtual.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-4">
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button onClick={onEdit} className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-accent-500 transition rounded-lg hover:bg-accent-50 dark:hover:bg-accent-900/10">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-rose-500 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/10">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-2 font-medium uppercase tracking-wide">Parcelas</p>
          <div className="space-y-1">
            {compra.parcelas.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">
                  {p.numero}/{compra.numParcelas} — {new Date(p.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 dark:text-slate-200">{BRL(p.valor)}</span>
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

function ComprasTab() {
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48 relative">
          <input
            type="text"
            placeholder="Buscar por descrição, cartão ou categoria…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-1.5 pl-9 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
          {(['todas', 'pendentes', 'quitadas'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                filtroStatus === s
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button onClick={() => { setShowForm(s => !s); setEditando(null) }} disabled={cartoes.length === 0}>
          <Plus size={16} className="inline mr-1" />Nova Compra
        </Button>
      </div>

      {cartoes.length === 0 && (
        <Card><p className="text-gray-500 dark:text-slate-400 text-sm">Cadastre ao menos um cartão (aba Cartões) antes de registrar compras.</p></Card>
      )}
      {showForm && <CompraForm cartoes={cartoes} onClose={fecharForm} />}
      {editando && <CompraForm cartoes={cartoes} onClose={fecharForm} editando={editando} />}
      {isLoading ? (
        <p className="text-gray-500 dark:text-slate-400">Carregando…</p>
      ) : compras.length === 0 ? (
        <Card><p className="text-gray-400 dark:text-slate-500">Nenhuma compra parcelada registrada.</p></Card>
      ) : comprasFiltradas.length === 0 ? (
        <Card><p className="text-gray-400 dark:text-slate-500 text-sm">Nenhuma compra encontrada para "{busca || filtroStatus}".</p></Card>
      ) : (
        <div className="space-y-4">
          {comprasFiltradas.map((c: Compra) => (
            <CompraCard
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

// ─── Recorrentes ──────────────────────────────────────────────────────────────
function RecorrenteForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<RecorrenteRequest>({ empresa: '', valor: 0, diaVencimento: 10 })
  const criar = useMutation({
    mutationFn: () => recorrentesApi.criar(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recorrentes'] }); onClose() },
  })
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-slate-100">Novo Pagamento Recorrente</h2>
        <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Empresa" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} placeholder="Ex: Netflix" />
        <Input label="Valor (R$)" type="number" step="0.01" min={0.01} value={form.valor}
          onChange={e => setForm(f => ({ ...f, valor: Number(e.target.value) }))} />
        <Input label="Dia Vencimento" type="number" min={1} max={31} value={form.diaVencimento}
          onChange={e => setForm(f => ({ ...f, diaVencimento: Number(e.target.value) }))} />
        <CategoriaSelect value={(form as any).categoria ?? ''} onChange={v => setForm(f => ({ ...f, categoria: v }))} />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={() => criar.mutate()} disabled={!form.empresa.trim() || !form.valor || criar.isPending}>Salvar</Button>
      </div>
    </Card>
  )
}

function RecorrentesTab() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [showForm, setShowForm] = useState(false)

  const { data: checklist = [], isLoading } = useQuery({
    queryKey: ['checklist', activeProfile?.id, ano, mes],
    queryFn: () => recorrentesApi.checklist(ano, mes),
    enabled: !!activeProfile,
  })
  const marcar = useMutation({
    mutationFn: ({ id, pago }: { id: number; pago: boolean }) =>
      recorrentesApi.marcarPago(id, ano, mes, pago),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist'] }),
  })
  const inativar = useMutation({
    mutationFn: (id: number) => recorrentesApi.inativar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recorrentes'] })
      qc.invalidateQueries({ queryKey: ['checklist'] })
    },
  })

  const totalMes = checklist.reduce((s, i) => s + i.valor, 0)
  const totalPago = checklist.filter(i => i.pago).reduce((s, i) => s + i.valor, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(s => !s)}><Plus size={16} className="inline mr-1" />Novo</Button>
      </div>
      {showForm && <RecorrenteForm onClose={() => setShowForm(false)} />}

      <Card className="flex items-center gap-4 flex-wrap !p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-slate-400">Mês:</label>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className={SELECT_CLS}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} className={SELECT_CLS}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y =>
              <option key={y} value={y}>{y}</option>
            )}
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-500 dark:text-slate-400">
          Pago: <span className="text-accent-600 dark:text-accent-400 font-semibold">{BRL(totalPago)}</span>
          {' '}/ Total: <span className="text-gray-900 dark:text-slate-200 font-semibold">{BRL(totalMes)}</span>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-gray-500 dark:text-slate-400">Carregando…</p>
      ) : checklist.length === 0 ? (
        <Card><p className="text-gray-400 dark:text-slate-500">Nenhum pagamento recorrente ativo.</p></Card>
      ) : (
        <div className="space-y-2">
          {checklist.map((item: ChecklistItem) => (
            <Card key={item.recorrenteId} className="flex items-center gap-4 !p-4">
              <button
                onClick={() => marcar.mutate({ id: item.recorrenteId, pago: !item.pago })}
                className={`flex-shrink-0 transition ${item.pago ? 'text-accent-500' : 'text-gray-300 dark:text-slate-600 hover:text-accent-500'}`}
              >
                {item.pago ? <CheckCircle size={22} /> : <Circle size={22} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${item.pago ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
                  {item.empresa}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">Vence dia {item.diaVencimento}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${item.pago ? 'text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
                  {BRL(item.valor)}
                </span>
                <Badge color={item.pago ? 'accent' : 'slate'}>{item.pago ? 'Pago' : 'Pendente'}</Badge>
                <button
                  onClick={() => inativar.mutate(item.recorrenteId)}
                  className="text-gray-300 dark:text-slate-600 hover:text-rose-500 transition"
                  title="Remover recorrente"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Fatura ───────────────────────────────────────────────────────────────────
function FaturaCartaoCard({ cartao }: { cartao: FaturaCartao }) {
  const [expanded, setExpanded] = useState(true)
  const pendente = cartao.total - cartao.totalPago
  const pctPago = cartao.total > 0 ? (cartao.totalPago / cartao.total) * 100 : 0

  return (
    <Card>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-600 dark:text-accent-400 flex-shrink-0">
            <CreditCard size={20} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-slate-100">{cartao.cartaoNome}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Vence dia {cartao.diaVencimento}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-slate-100">{BRL(cartao.total)}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {cartao.totalPago > 0 ? <span className="text-accent-600 dark:text-accent-400">{BRL(cartao.totalPago)} pago</span> : 'Nenhum pago'}
            </p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400 dark:text-slate-500" /> : <ChevronDown size={16} className="text-gray-400 dark:text-slate-500" />}
        </div>
      </button>

      {/* barra de progresso */}
      <div className="mt-3 h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-500 transition-all"
          style={{ width: `${pctPago}%` }}
        />
      </div>

      {expanded && (
        <div className="mt-4 border-t border-gray-100 dark:border-slate-700 pt-4 space-y-2">
          {cartao.itens.map(item => (
            <div key={item.parcelaId} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`flex-shrink-0 ${item.paga ? 'text-accent-500' : 'text-gray-300 dark:text-slate-600'}`}>
                  {item.paga ? <CheckCircle size={15} /> : <Circle size={15} />}
                </span>
                <span className={`truncate ${item.paga ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-200'}`}>
                  {item.descricao}
                </span>
                {item.categoria && (
                  <Badge color="slate">{item.categoria}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">
                  {item.numeroParcela}/{item.totalParcelas}
                </span>
                <span className={`font-semibold whitespace-nowrap ${item.paga ? 'text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
                  {BRL(item.valor)}
                </span>
              </div>
            </div>
          ))}

          <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-700 flex justify-between text-sm font-semibold">
            <span className="text-gray-500 dark:text-slate-400">Pendente</span>
            <span className="text-rose-600 dark:text-rose-400">{BRL(pendente)}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

function FaturaTab() {
  const { activeProfile } = useProfile()
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)

  const { data: fatura, isLoading } = useQuery({
    queryKey: ['fatura', activeProfile?.id, ano, mes],
    queryFn: () => faturaApi.get(ano, mes),
    enabled: !!activeProfile,
  })

  function navMes(delta: number) {
    const d = new Date(ano, mes - 1 + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth() + 1)
  }

  const mesLabel = new Date(ano, mes - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  const pendente = fatura ? fatura.totalGeral - fatura.totalPago : 0

  return (
    <div className="space-y-4">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navMes(-1)}
          className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-gray-900 dark:text-slate-100 capitalize">
          {mesLabel}
        </span>
        <button
          onClick={() => navMes(1)}
          className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Totais do mês */}
      {fatura && fatura.totalGeral > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="!p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Total fatura</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{BRL(fatura.totalGeral)}</p>
          </Card>
          <Card className="!p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Pago</p>
            <p className="text-xl font-bold text-accent-600 dark:text-accent-400">{BRL(fatura.totalPago)}</p>
          </Card>
          <Card className="!p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Pendente</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{BRL(pendente)}</p>
          </Card>
        </div>
      )}

      {/* Lista por cartão */}
      {isLoading ? (
        <p className="text-gray-500 dark:text-slate-400">Carregando…</p>
      ) : !fatura || fatura.cartoes.length === 0 ? (
        <Card>
          <p className="text-gray-400 dark:text-slate-500 text-center py-4">
            Nenhuma parcela vence em {mesLabel}.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {fatura.cartoes.map(cartao => (
            <FaturaCartaoCard key={cartao.cartaoId} cartao={cartao} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Resumo ───────────────────────────────────────────────────────────────────
function ResumoTab() {
  const { activeProfile } = useProfile()
  const { theme } = useTheme()
  const qc = useQueryClient()
  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth() + 1
  const [editandoReceita, setEditandoReceita] = useState(false)
  const [receitaInput, setReceitaInput] = useState('')

  const axisColor = theme === 'dark' ? '#94a3b8' : '#6b7280'
  const tooltipStyle = theme === 'dark'
    ? { background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }
    : { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12 }
  const tooltipLabelStyle = theme === 'dark' ? { color: '#f1f5f9' } : { color: '#111827' }

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ['resumo', activeProfile?.id, ano, mes],
    queryFn: () => dashboardApi.resumo(ano, mes),
    enabled: !!activeProfile,
  })
  const { data: projecao, isLoading: loadingProj } = useQuery({
    queryKey: ['projecao', activeProfile?.id],
    queryFn: dashboardApi.projecao,
    enabled: !!activeProfile,
  })
  const [patrimonioMeses, setPatrimonioMeses] = useState<6 | 12 | 24>(12)
  const { data: patrimonioHist, isLoading: loadingPatrimonio } = useQuery({
    queryKey: ['patrimonio-historico', activeProfile?.id, patrimonioMeses],
    queryFn: () => patrimonioApi.historico(patrimonioMeses),
    enabled: !!activeProfile,
  })

  const salvarReceita = useMutation({
    mutationFn: () => receitasApi.salvar(ano, mes, parseFloat(receitaInput.replace(',', '.')) || 0),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumo'] })
      setEditandoReceita(false)
    },
  })

  const receita   = resumo?.receita ?? 0
  const saldo     = resumo?.saldo   ?? 0
  const saldoPos  = saldo >= 0

  return (
    <div className="space-y-6">
      {/* Cards de receita / despesa / saldo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Receita editável */}
        <Card className="relative group">
          <p className="text-sm text-gray-500 dark:text-slate-400">Receita do mês</p>
          {editandoReceita ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.01"
                min={0}
                autoFocus
                value={receitaInput}
                onChange={e => setReceitaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && salvarReceita.mutate()}
                className="w-full text-lg font-bold bg-transparent border-b border-accent-400 outline-none text-gray-900 dark:text-slate-100"
              />
              <button onClick={() => salvarReceita.mutate()} className="text-accent-500 hover:text-accent-600 flex-shrink-0">
                <Check size={16} />
              </button>
              <button onClick={() => setEditandoReceita(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-accent-500">
                {loadingResumo ? '…' : BRL(receita)}
              </p>
              <button
                onClick={() => { setReceitaInput(String(receita)); setEditandoReceita(true) }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </Card>

        <Card>
          <p className="text-sm text-gray-500 dark:text-slate-400">Parcelas</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">
            {loadingResumo ? '…' : BRL(resumo?.totalParcelas ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-slate-400">Recorrentes</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">
            {loadingResumo ? '…' : BRL(resumo?.totalRecorrentes ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-slate-400">Saldo disponível</p>
          <p className={`text-2xl font-bold mt-1 ${saldoPos ? 'text-accent-500' : 'text-rose-500'}`}>
            {loadingResumo ? '…' : (saldoPos ? '' : '-') + BRL(Math.abs(saldo))}
          </p>
          {!loadingResumo && receita > 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {((( resumo?.totalGeral ?? 0) / receita) * 100).toFixed(0)}% comprometido
            </p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Projeção — próximos 12 meses
          </h2>
          {loadingProj ? (
            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-slate-500">Carregando…</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={projecao} barCategoryGap="30%">
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => BRL(v)} />
                <Bar dataKey="totalParcelas" name="Parcelas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalRecorrentes" name="Recorrentes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Categorias do mês
          </h2>
          {loadingResumo || !resumo?.categorias.length ? (
            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-slate-500">
              {loadingResumo ? 'Carregando…' : 'Sem dados este mês'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={resumo.categorias} dataKey="valor" nameKey="categoria"
                  cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                  {resumo.categorias.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={v => <span style={{ color: axisColor, fontSize: 12 }}>{v}</span>} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => BRL(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Evolução do Patrimônio */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
            Evolução do Patrimônio
          </h2>
          <div className="flex gap-1">
            {([6, 12, 24] as const).map(m => (
              <button
                key={m}
                onClick={() => setPatrimonioMeses(m)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  patrimonioMeses === m
                    ? 'bg-accent-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
        {loadingPatrimonio ? (
          <div className="h-56 flex items-center justify-center text-gray-400 dark:text-slate-500">Carregando…</div>
        ) : !patrimonioHist?.pontos.length ? (
          <div className="h-56 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-slate-500">
            <p className="text-sm">Nenhum snapshot de patrimônio disponível.</p>
            <p className="text-xs">Acesse a aba <strong>Investimentos</strong> para gerar o primeiro snapshot.</p>
          </div>
        ) : (
          <>
            {/* Summary row */}
            {(() => {
              const pts = patrimonioHist.pontos
              const last = pts[pts.length - 1]
              const prev = pts[pts.length - 2]
              const pct = prev && prev.totalAtual > 0
                ? ((last.totalAtual - prev.totalAtual) / prev.totalAtual) * 100
                : null
              const pnlPct = last.totalInvestido > 0
                ? ((last.totalAtual - last.totalInvestido) / last.totalInvestido) * 100
                : null
              return (
                <div className="flex flex-wrap gap-6 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Valor atual</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{BRL(last.totalAtual)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Investido</p>
                    <p className="text-xl font-bold text-gray-700 dark:text-slate-300">{BRL(last.totalInvestido)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">P&L total</p>
                    <p className={`text-xl font-bold ${last.pnlNominal >= 0 ? 'text-accent-500' : 'text-rose-500'}`}>
                      {last.pnlNominal >= 0 ? '+' : ''}{BRL(last.pnlNominal)}
                      {pnlPct !== null && <span className="text-sm ml-1">({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)</span>}
                    </p>
                  </div>
                  {pct !== null && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">vs anterior</p>
                      <p className={`text-xl font-bold ${pct >= 0 ? 'text-accent-500' : 'text-rose-500'}`}>
                        {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              )
            })()}
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={patrimonioHist.pontos} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(var(--accent-500))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="rgb(var(--accent-500))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradInvestido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false}
                  interval="preserveStartEnd" />
                <YAxis tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={52} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(v: number, name: string) => [BRL(v), name === 'totalAtual' ? 'Valor Atual' : 'Investido']}
                />
                <Area type="monotone" dataKey="totalInvestido" name="totalInvestido"
                  stroke="#94a3b8" strokeWidth={1.5} fill="url(#gradInvestido)" dot={false} />
                <Area type="monotone" dataKey="totalAtual" name="totalAtual"
                  stroke="rgb(var(--accent-500))" strokeWidth={2} fill="url(#gradAtual)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </Card>
    </div>
  )
}

// ─── Orçamentos ───────────────────────────────────────────────────────────────
function BarraProgresso({ pct }: { pct: number }) {
  const cor =
    pct >= 100 ? 'bg-rose-500' :
    pct >= 80  ? 'bg-amber-500' :
                 'bg-accent-500'
  return (
    <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${cor}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

function OrcamentosTab() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<OrcamentoRequest>({ categoria: '', valorLimite: 0 })
  const [erro, setErro] = useState('')

  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ['orcamentos', activeProfile?.id, ano, mes],
    queryFn: () => orcamentosApi.listar(ano, mes),
    enabled: !!activeProfile,
  })

  const criar = useMutation({
    mutationFn: () => orcamentosApi.criar(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orcamentos'] })
      setForm({ categoria: '', valorLimite: 0 })
      setShowForm(false)
      setErro('')
    },
    onError: (e: any) => setErro(e?.response?.data?.message ?? e?.message ?? 'Erro ao criar orçamento.'),
  })

  const deletar = useMutation({
    mutationFn: (id: number) => orcamentosApi.deletar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orcamentos'] }),
  })

  function navMes(delta: number) {
    const d = new Date(ano, mes - 1 + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth() + 1)
  }

  const mesLabel = new Date(ano, mes - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  const totalLimite = orcamentos.reduce((s, o) => s + o.valorLimite, 0)
  const totalGasto  = orcamentos.reduce((s, o) => s + o.gastoAtual, 0)

  return (
    <div className="space-y-4">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button onClick={() => navMes(-1)} className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-gray-900 dark:text-slate-100 capitalize">{mesLabel}</span>
        <button onClick={() => navMes(1)} className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Totais */}
      {orcamentos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="!p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Orçamento total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{BRL(totalLimite)}</p>
          </Card>
          <Card className="!p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Gasto até agora</p>
            <p className="text-xl font-bold text-amber-500">{BRL(totalGasto)}</p>
          </Card>
          <Card className="!p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Disponível</p>
            <p className={`text-xl font-bold ${totalLimite - totalGasto < 0 ? 'text-rose-500' : 'text-accent-500'}`}>
              {BRL(Math.max(totalLimite - totalGasto, 0))}
            </p>
          </Card>
        </div>
      )}

      {/* Botão novo */}
      <div className="flex justify-end">
        <Button onClick={() => { setShowForm(s => !s); setErro('') }}>
          <Plus size={16} className="inline mr-1" />Novo Orçamento
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Novo Orçamento</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Categoria"
              value={form.categoria}
              onChange={e => { setForm(f => ({ ...f, categoria: e.target.value })); setErro('') }}
              placeholder="Ex: Alimentação"
            />
            <Input
              label="Limite mensal (R$)"
              type="number"
              step="0.01"
              min={0.01}
              value={form.valorLimite || ''}
              onChange={e => setForm(f => ({ ...f, valorLimite: Number(e.target.value) }))}
            />
          </div>
          {erro && <p className="text-xs text-rose-500 mt-2">{erro}</p>}
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => criar.mutate()}
              disabled={!form.categoria.trim() || !form.valorLimite || criar.isPending}
            >
              Salvar
            </Button>
          </div>
        </Card>
      )}

      {/* Lista de orçamentos */}
      {isLoading ? (
        <p className="text-gray-500 dark:text-slate-400">Carregando…</p>
      ) : orcamentos.length === 0 ? (
        <Card>
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            Nenhum orçamento definido. Crie limites por categoria para acompanhar seus gastos.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orcamentos.map((o: Orcamento) => {
            const pct = o.percentual
            const cor = pct >= 100 ? 'text-rose-600 dark:text-rose-400' : pct >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-accent-600 dark:text-accent-400'
            const badgeColor = pct >= 100 ? 'rose' : pct >= 80 ? 'amber' : 'accent'
            return (
              <Card key={o.id}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{o.categoria}</p>
                    <Badge color={badgeColor as any}>{pct.toFixed(0)}%</Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${cor}`}>{BRL(o.gastoAtual)}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">de {BRL(o.valorLimite)}</p>
                    </div>
                    <button
                      onClick={() => deletar.mutate(o.id)}
                      disabled={deletar.isPending}
                      className="text-gray-300 dark:text-slate-600 hover:text-rose-500 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <BarraProgresso pct={pct} />
                {pct >= 100 && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5">
                    Limite excedido em {BRL(o.gastoAtual - o.valorLimite)}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Relatórios ───────────────────────────────────────────────────────────────
function RelatoriosTab() {
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [baixando, setBaixando] = useState<string | null>(null)

  async function baixar(chave: string, fn: () => Promise<void>) {
    setBaixando(chave)
    try { await fn() } finally { setBaixando(null) }
  }

  const anos = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="space-y-4 max-w-xl">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-600 dark:text-accent-400">
            <FileText size={18} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-slate-100">Compras parceladas por ano</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Todas as parcelas vencidas no ano — útil para declaração de IR</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select value={ano} onChange={e => setAno(Number(e.target.value))} className={SELECT_CLS}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <Button
            onClick={() => baixar('compras', () => relatoriosApi.comprasAno(ano))}
            disabled={baixando === 'compras'}
          >
            <Download size={15} className="inline mr-1.5" />
            {baixando === 'compras' ? 'Gerando…' : 'Baixar CSV'}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <FileText size={18} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-slate-100">Gastos do mês</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Parcelas + recorrentes de um mês específico</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className={SELECT_CLS}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} className={SELECT_CLS}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <Button
            onClick={() => baixar('gastos', () => relatoriosApi.gastosMes(ano, mes))}
            disabled={baixando === 'gastos'}
          >
            <Download size={15} className="inline mr-1.5" />
            {baixando === 'gastos' ? 'Gerando…' : 'Baixar CSV'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Consolidado ──────────────────────────────────────────────────────────────
function ConsolidadoTab() {
  const { theme } = useTheme()
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)

  const { data, isLoading } = useQuery({
    queryKey: ['consolidado', ano, mes],
    queryFn: () => dashboardApi.consolidado(ano, mes),
  })

  function navMes(delta: number) {
    const d = new Date(ano, mes - 1 + delta, 1)
    setAno(d.getFullYear()); setMes(d.getMonth() + 1)
  }

  const mesLabel = new Date(ano, mes - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  const axisColor = theme === 'dark' ? '#94a3b8' : '#6b7280'
  const tooltipStyle = { backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid ' + (theme === 'dark' ? '#334155' : '#e5e7eb'), borderRadius: 8 }

  const chartData = (data as ConsolidadoMes | undefined)?.perfis.map(p => ({
    name: p.perfilNome,
    receita: p.receita,
    despesas: p.totalGeral,
    saldo: p.saldo,
  })) ?? []

  return (
    <div className="space-y-6">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button onClick={() => navMes(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"><ChevronLeft size={18} /></button>
        <span className="text-sm font-medium text-gray-700 dark:text-slate-300 capitalize">{mesLabel}</span>
        <button onClick={() => navMes(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"><ChevronRight size={18} /></button>
      </div>

      {isLoading ? (
        <p className="text-gray-500 dark:text-slate-400">Carregando…</p>
      ) : !data ? null : (
        <>
          {/* Cards totais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Receita Total</p>
              <p className="text-2xl font-bold text-accent-600 dark:text-accent-400 mt-1">{BRL(data.totalReceita)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Despesas Totais</p>
              <p className="text-2xl font-bold text-rose-500 mt-1">{BRL(data.totalDespesas)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Saldo Consolidado</p>
              <p className={`text-2xl font-bold mt-1 ${data.totalSaldo >= 0 ? 'text-accent-600 dark:text-accent-400' : 'text-rose-500'}`}>
                {BRL(data.totalSaldo)}
              </p>
            </Card>
          </div>

          {/* Tabela por perfil */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">Resumo por Perfil</h2>
            {data.perfis.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm">Nenhum perfil cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {data.perfis.map(p => {
                  const pct = p.receita > 0 ? Math.round((p.totalGeral / p.receita) * 100) : 0
                  const cor = pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-accent-500'
                  return (
                    <div key={p.perfilId} className="p-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-slate-100">{p.perfilNome}</span>
                        <span className={`text-sm font-semibold ${p.saldo >= 0 ? 'text-accent-600 dark:text-accent-400' : 'text-rose-500'}`}>
                          {BRL(p.saldo)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1.5">
                        <span>Receita: {BRL(p.receita)}</span>
                        <span>Despesas: {BRL(p.totalGeral)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                        <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Gráfico comparativo */}
          {chartData.length > 0 && (
            <Card>
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">Comparativo por Perfil</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => BRL(v)} />
                  <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ─── Categorias ───────────────────────────────────────────────────────────────
const dot = (cor: string) => CORES.find(c => c.value === cor)?.tw ?? 'bg-slate-500'

function CoresPicker({ value, onChange }: { value: Cor; onChange: (c: Cor) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CORES.map(c => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => onChange(c.value)}
          className={`w-6 h-6 rounded-full ${c.tw} transition ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ${value === c.value ? 'ring-2 ring-gray-600 dark:ring-slate-300' : 'hover:scale-110'}`}
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
      <li className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 space-y-3">
        <div className="flex gap-3">
          <Input
            value={nome}
            onChange={e => { setNome(e.target.value); setErro('') }}
            placeholder="Nome da categoria"
            className="flex-1"
          />
          <button onClick={() => atualizar.mutate()} disabled={!nome.trim() || atualizar.isPending} className="text-accent-500 hover:text-accent-600 disabled:opacity-40">
            <Check size={18} />
          </button>
          <button onClick={() => { setEditing(false); setNome(cat.nome); setCor(cat.cor) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>
        <CoresPicker value={cor} onChange={setCor} />
        {erro && <p className="text-xs text-rose-500">{erro}</p>}
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot(cat.cor)}`} />
        <span className="font-medium text-gray-900 dark:text-slate-100">{cat.nome}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(true)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">
          <Pencil size={15} />
        </button>
        <button onClick={onDelete} className="text-gray-300 dark:text-slate-600 hover:text-rose-500 transition">
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  )
}

function CategoriasTab() {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setShowForm(s => !s); setErro('') }}>
          <Plus size={16} className="inline mr-1" />Nova Categoria
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Nova Categoria</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={18} /></button>
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
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-2">Cor</label>
              <CoresPicker value={cor} onChange={setCor} />
            </div>
            {erro && <p className="text-xs text-rose-500">{erro}</p>}
            <div className="flex justify-end">
              <Button onClick={() => criar.mutate()} disabled={!nome.trim() || criar.isPending}>Salvar</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <p className="text-gray-500 dark:text-slate-400 text-sm">Carregando…</p>
        ) : categorias.length === 0 ? (
          <p className="text-gray-400 dark:text-slate-500 text-sm">
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { activeProfile } = useProfile()
  const [activeTab, setActiveTab] = useState<Tab>('Resumo')
  const [consolidado, setConsolidado] = useState(false)
  const now = new Date()

  const { data: todosPerfis = [] } = useQuery({
    queryKey: ['perfis'],
    queryFn: perfisApi.listar,
  })

  if (!activeProfile) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Card className="text-center max-w-sm w-full">
          <p className="text-gray-500 dark:text-slate-400">
            Selecione um perfil em <strong className="text-gray-900 dark:text-slate-200">Perfis</strong> para começar.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        {todosPerfis.length > 1 && (
          <button
            onClick={() => setConsolidado(s => !s)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
              consolidado
                ? 'bg-violet-500 text-white border-violet-600'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-violet-400'
            }`}
          >
            <Layers size={15} />
            Consolidado
          </button>
        )}
      </div>

      {consolidado ? (
        <ConsolidadoTab />
      ) : (
        <>
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'text-accent-600 dark:text-accent-400 border-accent-500'
                      : 'text-gray-500 dark:text-slate-400 border-transparent hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'Resumo'      && <ResumoTab />}
          {activeTab === 'Orçamentos'  && <OrcamentosTab />}
          {activeTab === 'Fatura'      && <FaturaTab />}
          {activeTab === 'Compras'     && <ComprasTab />}
          {activeTab === 'Cartões'     && <CartoesTab />}
          {activeTab === 'Recorrentes' && <RecorrentesTab />}
          {activeTab === 'Relatórios'  && <RelatoriosTab />}
          {activeTab === 'Categorias'  && <CategoriasTab />}
        </>
      )}
    </div>
  )
}
