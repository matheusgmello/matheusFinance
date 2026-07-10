import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  irApi, TipoOperacao, AssetType, Categoria,
  OperacaoRequest, ResumoPorCategoria, ApuracaoMensal, Isentometro,
} from '../../domains/ir/api'
import { useProfile } from '../../shared/context/ProfileContext'
import { Card } from '../../shared/components/ui/Card'
import { Button } from '../../shared/components/ui/Button'
import { Input } from '../../shared/components/ui/Input'
import { Badge } from '../../shared/components/ui/Badge'
import { Plus, Trash2, AlertCircle, CheckCircle2, FileText, Upload, Download, Filter } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const PCT = (v: number) => `${v.toFixed(1)}%`

const ASSET_LABEL: Record<AssetType, string> = {
  STOCK: 'Ação', FII: 'FII', TREASURY: 'Tesouro',
  BDR: 'BDR', ETF: 'ETF', ETF_INT: 'ETF Int.', STOCK_INT: 'Stock Int.',
}

const CAT_LABEL: Record<Categoria, string> = {
  SWING_TRADE_ACAO: 'Swing Trade — Ações',
  DAY_TRADE_ACAO:   'Day Trade — Ações',
  FII:              'FIIs',
  TREASURY:         'Tesouro Direto',
  BDR_ETF:          'BDR / ETF Nacional',
  STOCK_INT:        'Ações / ETF Internacional',
}

const CAT_CODIGO_DARF: Record<Categoria, string> = {
  SWING_TRADE_ACAO: '6015',
  DAY_TRADE_ACAO:   '6015',
  FII:              '6015',
  TREASURY:         '0977',
  BDR_ETF:          '6015',
  STOCK_INT:        '6015',
}

const SELECT_CLS = 'bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500'

function today() { return new Date().toISOString().slice(0, 10) }

function exportCsv(filename: string, rows: string[][], headers: string[]) {
  const lines = [headers, ...rows].map(r =>
    r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')
  )
  const bom = '﻿'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Operações Tab ────────────────────────────────────────────────────────────

function OperacoesTab() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [form, setForm] = useState<OperacaoRequest>({
    ticker: '', tipo: 'COMPRA', quantidade: 0, preco: 0,
    data: today(), dayTrade: false, assetType: 'STOCK',
  })
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Filtros
  const anoAtual = new Date().getFullYear()
  const [filtroAno,       setFiltroAno]       = useState<string>('todos')
  const [filtroTicker,    setFiltroTicker]    = useState('')
  const [filtroTipo,      setFiltroTipo]      = useState<TipoOperacao | 'todos'>('todos')
  const [filtroAsset,     setFiltroAsset]     = useState<AssetType | 'todos'>('todos')

  const { data: ops = [], isLoading } = useQuery({
    queryKey: ['ir', 'operacoes', activeProfile?.id],
    queryFn: irApi.listar,
    enabled: !!activeProfile,
  })

  const opsFiltradas = [...ops].reverse().filter(op => {
    if (filtroAno !== 'todos' && !op.data.startsWith(filtroAno)) return false
    if (filtroTicker && !op.ticker.toUpperCase().includes(filtroTicker.toUpperCase())) return false
    if (filtroTipo !== 'todos' && op.tipo !== filtroTipo) return false
    if (filtroAsset !== 'todos' && op.assetType !== filtroAsset) return false
    return true
  })

  const { data: posicoes = [] } = useQuery({
    queryKey: ['ir', 'posicoes', activeProfile?.id],
    queryFn: irApi.posicoes,
    enabled: !!activeProfile,
  })

  const criar = useMutation({
    mutationFn: () => irApi.criar(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ir'] })
      setShowForm(false)
      setForm({ ticker: '', tipo: 'COMPRA', quantidade: 0, preco: 0, data: today(), dayTrade: false, assetType: 'STOCK' })
    },
  })

  const deletar = useMutation({
    mutationFn: (id: number) => irApi.deletar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ir'] }),
  })

  const importar = useMutation({
    mutationFn: (file: File) => irApi.importCsv(file),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['ir'] })
      setImportMsg(`Importadas: ${res.imported} | Duplicadas: ${res.duplicados} | Ignoradas: ${res.skipped}`)
      setTimeout(() => setImportMsg(null), 6000)
    },
  })

  if (isLoading) return <p className="text-sm text-gray-400 dark:text-slate-500">Carregando…</p>

  return (
    <div className="space-y-6">

      {/* Custo médio atual */}
      {posicoes.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Posição Atual — Custo Médio
            </h3>
            <Button variant="ghost" onClick={() => exportCsv(
              `posicoes_${new Date().toISOString().slice(0,10)}.csv`,
              posicoes.map(p => [p.ticker, ASSET_LABEL[p.assetType], String(p.quantidadeAtual), String(p.custoMedio.toFixed(2)), String(p.custoTotal.toFixed(2))]),
              ['Ticker', 'Tipo', 'Quantidade', 'Custo Médio', 'Custo Total']
            )}>
              <Download size={14} className="inline mr-1.5" />CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700 text-left">
                  <th className="pb-2 font-medium">Ticker</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium text-right">Qtd</th>
                  <th className="pb-2 font-medium text-right">Custo Médio</th>
                  <th className="pb-2 font-medium text-right">Custo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {posicoes.map(p => (
                  <tr key={p.ticker} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="py-2 font-mono font-semibold text-gray-900 dark:text-slate-100">{p.ticker}</td>
                    <td className="py-2"><Badge color="slate">{ASSET_LABEL[p.assetType]}</Badge></td>
                    <td className="py-2 text-right text-gray-600 dark:text-slate-300">{p.quantidadeAtual}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-slate-300">{BRL(p.custoMedio)}</td>
                    <td className="py-2 text-right font-semibold text-gray-900 dark:text-slate-100">{BRL(p.custoTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Lista de operações */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
            Operações ({opsFiltradas.length}{opsFiltradas.length !== ops.length ? `/${ops.length}` : ''})
          </h3>
          <div className="flex gap-2 flex-wrap">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) importar.mutate(f); e.target.value = '' }}
            />
            <Button variant="ghost" onClick={() => setShowFilters(s => !s)}>
              <Filter size={14} className="inline mr-1.5" />Filtros
            </Button>
            <Button variant="ghost" onClick={() => exportCsv(
              `operacoes_${new Date().toISOString().slice(0,10)}.csv`,
              opsFiltradas.map(op => [op.data, op.ticker, op.tipo, String(op.quantidade), String(op.preco), String(op.totalOperacao), op.dayTrade ? 'Sim' : 'Não', ASSET_LABEL[op.assetType]]),
              ['Data', 'Ticker', 'Tipo', 'Quantidade', 'Preço', 'Total', 'Day Trade', 'Tipo Ativo']
            )}>
              <Download size={14} className="inline mr-1.5" />CSV
            </Button>
            <Button variant="ghost" onClick={() => fileRef.current?.click()} disabled={importar.isPending}>
              <Upload size={14} className="inline mr-1.5" />
              {importar.isPending ? 'Importando…' : 'Import B3'}
            </Button>
            <Button onClick={() => setShowForm(s => !s)}>
              <Plus size={14} className="inline mr-1.5" />Nova
            </Button>
          </div>
        </div>

        {/* Barra de filtros */}
        {showFilters && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Ano</label>
                <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} className={SELECT_CLS}>
                  <option value="todos">Todos</option>
                  {Array.from({ length: 5 }, (_, i) => anoAtual - i).map(a => (
                    <option key={a} value={String(a)}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Ticker</label>
                <input
                  type="text" placeholder="PETR4" value={filtroTicker}
                  onChange={e => setFiltroTicker(e.target.value.toUpperCase())}
                  className={SELECT_CLS}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Operação</label>
                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as TipoOperacao | 'todos')} className={SELECT_CLS}>
                  <option value="todos">Todas</option>
                  <option value="COMPRA">Compra</option>
                  <option value="VENDA">Venda</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Tipo Ativo</label>
                <select value={filtroAsset} onChange={e => setFiltroAsset(e.target.value as AssetType | 'todos')} className={SELECT_CLS}>
                  <option value="todos">Todos</option>
                  {(Object.keys(ASSET_LABEL) as AssetType[]).map(a => (
                    <option key={a} value={a}>{ASSET_LABEL[a]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        {importMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
            {importMsg}
          </div>
        )}

        {showForm && (
          <div className="mb-5 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="Ticker" placeholder="PETR4"
                value={form.ticker}
                onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Tipo Ativo</label>
                <select value={form.assetType} onChange={e => setForm(f => ({ ...f, assetType: e.target.value as AssetType }))} className={SELECT_CLS}>
                  <option value="STOCK">Ação</option>
                  <option value="FII">FII</option>
                  <option value="TREASURY">Tesouro Direto</option>
                  <option value="BDR">BDR</option>
                  <option value="ETF">ETF Nacional</option>
                  <option value="ETF_INT">ETF Internacional</option>
                  <option value="STOCK_INT">Ação/REIT Internacional</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Operação</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoOperacao }))} className={SELECT_CLS}>
                  <option value="COMPRA">Compra</option>
                  <option value="VENDA">Venda</option>
                </select>
              </div>
              <Input label="Data" type="date" value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="Quantidade" type="number" min="0" step="1" placeholder="100"
                value={form.quantidade || ''}
                onChange={e => setForm(f => ({ ...f, quantidade: parseFloat(e.target.value) || 0 }))} />
              <Input label="Preço unit. (R$)" type="number" min="0" step="0.01" placeholder="32,50"
                value={form.preco || ''}
                onChange={e => setForm(f => ({ ...f, preco: parseFloat(e.target.value) || 0 }))} />
              <div className="flex flex-col gap-1 justify-end">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400 invisible">-</label>
                <label className="flex items-center gap-2 cursor-pointer h-[38px]">
                  <input type="checkbox" checked={form.dayTrade}
                    onChange={e => setForm(f => ({ ...f, dayTrade: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm text-gray-700 dark:text-slate-300">Day Trade</span>
                </label>
              </div>
              <div className="flex flex-col gap-1 justify-end">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400 invisible">-</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 h-[38px] flex items-center">
                  Total: {BRL((form.quantidade || 0) * (form.preco || 0))}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button
                onClick={() => criar.mutate()}
                disabled={!form.ticker || !form.quantidade || !form.preco || criar.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        )}

        {ops.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">
            Nenhuma operação registrada. Adicione compras e vendas para calcular o IR.
          </p>
        ) : opsFiltradas.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">
            Nenhuma operação encontrada com os filtros aplicados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700 text-left">
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Ticker</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium text-right">Qtd</th>
                  <th className="pb-2 font-medium text-right">Preço</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium text-center">DT</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {opsFiltradas.map(op => (
                  <tr key={op.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-2 text-xs text-gray-500 dark:text-slate-400">{op.data}</td>
                    <td className="py-2 font-mono font-semibold text-gray-900 dark:text-slate-100">{op.ticker}</td>
                    <td className="py-2">
                      <Badge color={op.tipo === 'COMPRA' ? 'accent' : 'rose' as any}>
                        {op.tipo}
                      </Badge>
                    </td>
                    <td className="py-2 text-right text-gray-600 dark:text-slate-300">{op.quantidade}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-slate-300">{BRL(op.preco)}</td>
                    <td className="py-2 text-right font-semibold text-gray-900 dark:text-slate-100">{BRL(op.totalOperacao)}</td>
                    <td className="py-2 text-center text-xs text-gray-400 dark:text-slate-500">
                      {op.dayTrade ? '✓' : '—'}
                    </td>
                    <td className="py-2 text-right">
                      <button onClick={() => deletar.mutate(op.id)}
                        className="text-gray-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Apuração Tab ─────────────────────────────────────────────────────────────

function MesRow({ m, onDownloadDarf }: { m: ApuracaoMensal; onDownloadDarf?: () => void }) {
  const [open, setOpen] = useState(false)
  const deveIR = m.impostoDevido > 0.005

  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <td className="py-2.5 text-sm text-gray-700 dark:text-slate-300 font-medium">{m.mes}</td>
        <td className="py-2.5 text-right text-sm text-gray-600 dark:text-slate-400">{BRL(m.totalVendido)}</td>
        <td className="py-2.5 text-right text-sm">
          <span className={m.resultadoBruto >= 0 ? 'text-accent-600 dark:text-accent-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
            {m.resultadoBruto >= 0 ? '+' : ''}{BRL(m.resultadoBruto)}
          </span>
        </td>
        <td className="py-2.5 text-right text-sm text-gray-500 dark:text-slate-400">
          {m.prejuizoAnterior > 0 ? `-${BRL(m.prejuizoAnterior)}` : '—'}
        </td>
        <td className="py-2.5 text-right text-sm font-bold">
          {m.isento ? (
            <Badge color="accent">Isento</Badge>
          ) : deveIR ? (
            <span className="text-rose-600 dark:text-rose-400">{BRL(m.impostoDevido)}</span>
          ) : m.resultadoBruto < 0 ? (
            <Badge color="slate">Prejuízo</Badge>
          ) : (
            <span className="text-gray-400 dark:text-slate-500">R$ 0</span>
          )}
        </td>
        <td className="py-2.5 text-center" onClick={e => e.stopPropagation()}>
          {deveIR && onDownloadDarf ? (
            <button
              onClick={onDownloadDarf}
              title="Baixar DARF PDF"
              className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium transition-colors"
            >
              <Download size={13} /> PDF
            </button>
          ) : (
            <span className="text-xs text-gray-400 dark:text-slate-500">{open ? '▲' : '▼'}</span>
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50 dark:bg-slate-800/40">
          <td colSpan={6} className="px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><p className="text-gray-400 dark:text-slate-500 mb-0.5">Total Vendido</p><p className="font-semibold">{BRL(m.totalVendido)}</p></div>
              <div><p className="text-gray-400 dark:text-slate-500 mb-0.5">Custo Médio</p><p className="font-semibold">{BRL(m.custoVendido)}</p></div>
              <div><p className="text-gray-400 dark:text-slate-500 mb-0.5">Resultado Bruto</p><p className={`font-semibold ${m.resultadoBruto >= 0 ? 'text-accent-600 dark:text-accent-400' : 'text-rose-600 dark:text-rose-400'}`}>{BRL(m.resultadoBruto)}</p></div>
              <div><p className="text-gray-400 dark:text-slate-500 mb-0.5">Alíquota</p><p className="font-semibold">{PCT(m.aliquota)}</p></div>
              <div><p className="text-gray-400 dark:text-slate-500 mb-0.5">Base de Cálculo</p><p className="font-semibold">{BRL(m.baseCalculo)}</p></div>
              <div><p className="text-gray-400 dark:text-slate-500 mb-0.5">Prejuízo Compensado</p><p className="font-semibold">{BRL(m.prejuizoAnterior)}</p></div>
              <div><p className="text-gray-400 dark:text-slate-500 mb-0.5">Saldo Prejuízo Final</p><p className="font-semibold text-rose-500">{BRL(m.saldoPrejuizoFinal)}</p></div>
              {m.isento && <div className="col-span-2"><p className="text-gray-400 dark:text-slate-500 mb-0.5">Isenção</p><p className="font-semibold text-accent-600 dark:text-accent-400">Vendas ≤ R$ 20.000 no mês</p></div>}
              {deveIR && <div><p className="text-gray-400 dark:text-slate-500 mb-0.5">Código DARF</p><p className="font-mono font-semibold">{CAT_CODIGO_DARF[m.categoria]}</p></div>}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function CategoriaCard({ cat }: { cat: ResumoPorCategoria }) {
  const [open, setOpen] = useState(cat.totalImpostoDevido > 0)
  if (cat.meses.length === 0) return null

  return (
    <Card>
      <button
        className="w-full flex items-center justify-between mb-2"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
            {CAT_LABEL[cat.categoria]}
          </h3>
          {cat.totalImpostoDevido > 0 && (
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-lg">
              DARF: {BRL(cat.totalImpostoDevido)}
            </span>
          )}
          {cat.saldoPrejuizoAtual > 0 && (
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Prejuízo acumulado: {BRL(cat.saldoPrejuizoAtual)}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700 text-left">
                <th className="pb-2 font-medium">Mês</th>
                <th className="pb-2 font-medium text-right">Vendido</th>
                <th className="pb-2 font-medium text-right">Resultado</th>
                <th className="pb-2 font-medium text-right">Prej. anterior</th>
                <th className="pb-2 font-medium text-right">IR Devido</th>
                <th className="pb-2 w-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {cat.meses.map(m => (
                <MesRow
                  key={m.mes}
                  m={m}
                  onDownloadDarf={m.impostoDevido > 0.005
                    ? () => irApi.darfPdf(m.mes, cat.categoria)
                    : undefined}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function CardIsentometro({ data }: { data: Isentometro }) {
  const pct = Math.min(data.percentual, 100)
  const barColor =
    pct >= 100 ? 'bg-rose-500' :
    pct >= 80  ? 'bg-amber-500' :
    pct >= 50  ? 'bg-yellow-400' :
                 'bg-accent-500'
  const textColor =
    pct >= 100 ? 'text-rose-600 dark:text-rose-400' :
    pct >= 80  ? 'text-amber-600 dark:text-amber-400' :
                 'text-accent-600 dark:text-accent-400'

  const mesLabel = (() => {
    const [y, m] = data.mes.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  })()

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
            Isentômetro — Swing Trade Ações
          </h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 capitalize">{mesLabel}</p>
        </div>
        <div className="text-right flex-shrink-0">
          {data.isento ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400">
              <CheckCircle2 size={12} /> Isento
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertCircle size={12} /> Tributável
            </span>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-3 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className={`font-bold ${textColor}`}>
          {BRL(data.totalVendido)}
        </span>
        <span className="text-gray-400 dark:text-slate-500">
          limite {BRL(data.limiteIsencao)}
        </span>
      </div>

      {data.percentual > 100 && (
        <p className="mt-2 text-xs text-rose-500 dark:text-rose-400">
          Vendas ultrapassaram R$ 20.000 — o lucro é tributável em {PCT(data.percentual - 100 > 0 ? 15 : 0)}%.
          Verifique a apuração abaixo.
        </p>
      )}
      {pct >= 80 && pct < 100 && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Atenção: {PCT(100 - data.percentual)} de margem restante para a isenção de R$ 20.000.
        </p>
      )}
    </Card>
  )
}

function ApuracaoTab() {
  const { activeProfile } = useProfile()
  const anoAtual = new Date().getFullYear()
  const [ano, setAno] = useState(anoAtual)

  const { data: apuracao, isLoading } = useQuery({
    queryKey: ['ir', 'apuracao', activeProfile?.id, ano],
    queryFn: () => irApi.apurar(ano),
    enabled: !!activeProfile,
  })

  const { data: isentometro } = useQuery({
    queryKey: ['ir', 'isentometro', activeProfile?.id],
    queryFn: irApi.isentometro,
    enabled: !!activeProfile,
    refetchInterval: 5 * 60 * 1000,
  })

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i)
  const totalImposto = apuracao?.totalImpostoAno ?? 0
  const temDados = apuracao?.categorias.some(c => c.meses.length > 0)

  if (isLoading) return <p className="text-sm text-gray-400 dark:text-slate-500">Calculando…</p>

  return (
    <div className="space-y-6">

      {/* Isentômetro — sempre visível no topo */}
      {isentometro && <CardIsentometro data={isentometro} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <select value={ano} onChange={e => setAno(Number(e.target.value))} className={SELECT_CLS}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Total IR Devido {ano}</p>
            <p className={`text-xl font-bold ${totalImposto > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-accent-500'}`}>
              {BRL(totalImposto)}
            </p>
          </div>
        </div>
        {totalImposto > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl">
            <AlertCircle size={14} />
            Verifique os meses em vermelho — DARF deve ser pago até o último dia útil do mês seguinte.
          </div>
        )}
        {totalImposto === 0 && temDados && (
          <div className="flex items-center gap-2 text-xs text-accent-600 dark:text-accent-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl">
            <CheckCircle2 size={14} />
            Nenhum DARF devido em {ano}. Confira o saldo de prejuízos acumulados abaixo.
          </div>
        )}
      </div>

      {/* Info IRPF + botão declaração */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
        <FileText size={16} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold mb-1">Como usar na declaração do IRPF</p>
          <p>Use os valores de "Resultado Bruto" por categoria para preencher a ficha <strong>Renda Variável</strong> do programa da Receita Federal. Prejuízos acumulados vão na coluna "Prejuízo a compensar" do mês seguinte.</p>
        </div>
        <button
          onClick={() => irApi.declaracaoPdf(ano)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-800/40 hover:bg-blue-200 dark:hover:bg-blue-800/70 text-blue-700 dark:text-blue-300 text-xs font-medium transition-colors"
          title={`Baixar relatório IRPF ${ano} em PDF`}
        >
          <Download size={12} /> Relatório IRPF {ano}
        </button>
      </div>

      {/* Categorias */}
      {!temDados ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500 gap-3">
          <FileText size={40} className="opacity-30" />
          <p className="text-sm font-medium">Nenhuma venda registrada em {ano}.</p>
          <p className="text-xs">Adicione operações na aba Operações para ver a apuração.</p>
        </div>
      ) : (
        apuracao?.categorias.map(cat => (
          <CategoriaCard key={cat.categoria} cat={cat} />
        ))
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'Operações' | 'Apuração IR'
const TABS: Tab[] = ['Operações', 'Apuração IR']

export default function IrPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Operações')
  const { activeProfile } = useProfile()

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-slate-500 text-sm">
        Selecione um perfil para usar a Calculadora IR.
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Calculadora IR / DARF</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Apuração mensal de imposto sobre renda variável — Ações, FIIs, BDRs, ETFs e Tesouro Direto
        </p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit mb-6">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Operações' && <OperacoesTab />}
      {activeTab === 'Apuração IR' && <ApuracaoTab />}
    </div>
  )
}
