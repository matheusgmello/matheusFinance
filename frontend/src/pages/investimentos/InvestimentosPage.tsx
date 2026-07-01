import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { investimentosApi, InvestmentType, FiiMetrica } from '../../api/investimentos'
import { patrimonioApi } from '../../api/patrimonio'
import { alertasPrecoApi, AlertaPreco, Direcao } from '../../api/alertas-preco'
import { proventosApi, TipoProvento, ImportResult as ProventoImportResult, CalendarioMes } from '../../api/proventos'
import { benchmarksApi } from '../../api/benchmarks'
import { rebalanceamentoApi, TipoAlvo, AlvoRequest } from '../../api/rebalanceamento'
import { useProfile } from '../../context/ProfileContext'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LineChart, Line,
} from 'recharts'
import { Upload, TrendingUp, AlertCircle, CheckCircle2, Circle, RefreshCw, BarChart2, Bell, BellOff, Plus, X, Trash2, DollarSign, Download } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function exportCsv(filename: string, rows: string[][], headers: string[]) {
  const lines = [headers, ...rows].map(r =>
    r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')
  )
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const NUM = (v: number, dec = 0) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const TYPE_LABEL: Record<InvestmentType, string> = {
  STOCK: 'Ações',
  FII: 'FIIs',
  TREASURY: 'Tesouro Direto',
  BDR: 'BDRs',
  ETF: 'ETFs',
  ETF_INT: 'ETFs Internacionais',
  STOCK_INT: 'Ações Internacionais',
  RENDA_FIXA: 'Renda Fixa',
}

const TYPE_COLOR: Record<InvestmentType, string> = {
  STOCK: '#10b981',
  FII: '#6366f1',
  TREASURY: '#f59e0b',
  BDR: '#06b6d4',
  ETF: '#8b5cf6',
  ETF_INT: '#ec4899',
  STOCK_INT: '#f97316',
  RENDA_FIXA: '#64748b',
}

const TYPE_BADGE: Record<InvestmentType, 'accent' | 'slate' | 'amber'> = {
  STOCK: 'accent',
  FII: 'slate',
  TREASURY: 'amber',
  BDR: 'slate',
  ETF: 'slate',
  ETF_INT: 'slate',
  STOCK_INT: 'slate',
  RENDA_FIXA: 'slate',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Carteira Tab ─────────────────────────────────────────────────────────────

function PnlBadge({ pnlPercent }: { pnlPercent: number | null }) {
  if (pnlPercent === null) return <span className="text-gray-400 dark:text-slate-500">—</span>
  const positive = pnlPercent >= 0
  return (
    <span className={`font-semibold ${positive ? 'text-accent-600 dark:text-accent-400' : 'text-rose-600 dark:text-rose-400'}`}>
      {positive ? '+' : ''}{pnlPercent.toFixed(2)}%
    </span>
  )
}

function PnlNominal({ pnlNominal }: { pnlNominal: number | null }) {
  if (pnlNominal === null) return <span className="text-gray-400 dark:text-slate-500">—</span>
  const positive = pnlNominal >= 0
  return (
    <span className={positive ? 'text-accent-600 dark:text-accent-400' : 'text-rose-600 dark:text-rose-400'}>
      {positive ? '+' : ''}{BRL(pnlNominal)}
    </span>
  )
}

type SortFii = 'totalValue' | 'pvp' | 'dy'

function CarteiraTab() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const [sortFii, setSortFii] = useState<SortFii>('totalValue')

  const { data, isLoading } = useQuery({
    queryKey: ['investments', 'summary', activeProfile?.id],
    queryFn: investimentosApi.summary,
    enabled: !!activeProfile,
  })

  const { data: fiiMetricas = [] } = useQuery({
    queryKey: ['investments', 'fii-metricas', activeProfile?.id],
    queryFn: investimentosApi.fiiMetricas,
    enabled: !!activeProfile,
    staleTime: 5 * 60 * 1000, // 5 min — dados fundamentalistas não mudam a cada segundo
  })

  const fiiMetricaMap = Object.fromEntries(fiiMetricas.map((m: FiiMetrica) => [m.ticker, m]))

  const refresh = useMutation({
    mutationFn: investimentosApi.refreshPrices,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investments', 'summary', activeProfile?.id] }),
  })

  const refreshTreasury = useMutation({
    mutationFn: investimentosApi.refreshTreasury,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investments', 'summary', activeProfile?.id] }),
  })

  const gerarSnapshot = useMutation({
    mutationFn: patrimonioApi.snapshot,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patrimonio-historico'] }),
  })

  if (isLoading) {
    return <p className="text-gray-500 dark:text-slate-400 text-sm">Carregando…</p>
  }

  const positions = data?.positions ?? []
  const grandTotal = data?.grandTotal ?? 0
  const lastUpdate = positions.find(p => p.lastPriceUpdate)?.lastPriceUpdate

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 dark:text-slate-500 gap-3">
        <TrendingUp size={48} className="opacity-30" />
        <p className="text-base font-medium">Nenhuma posição importada ainda.</p>
        <p className="text-sm">Use a aba <strong>Importar</strong> para carregar seu extrato B3.</p>
      </div>
    )
  }

  const allTypes = Array.from(new Set(positions.map(p => p.type))) as InvestmentType[]
  const byType = allTypes
    .map(type => {
      const items = positions.filter(p => p.type === type)
      return { type, items, total: items.reduce((s, p) => s + (p.currentValue ?? p.totalValue), 0) }
    })
    .filter(g => g.items.length > 0)

  const pieData = byType
    .filter(g => g.total > 0)
    .map(g => ({ name: TYPE_LABEL[g.type], value: g.total, color: TYPE_COLOR[g.type] }))

  const refDate = positions[0]?.referenceDate

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-gray-400 dark:text-slate-500 space-y-0.5">
          {refDate && <p>Posição de referência: <span className="font-medium">{refDate}</span></p>}
          {lastUpdate && (
            <p>Preços atualizados: <span className="font-medium">
              {new Date(lastUpdate).toLocaleString('pt-BR')}
            </span></p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => refreshTreasury.mutate()}
            disabled={refreshTreasury.isPending}
          >
            <RefreshCw size={14} className={`inline mr-1.5 ${refreshTreasury.isPending ? 'animate-spin' : ''}`} />
            {refreshTreasury.isPending ? 'Atualizando…' : 'Atualizar Tesouro'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
          >
            <RefreshCw size={14} className={`inline mr-1.5 ${refresh.isPending ? 'animate-spin' : ''}`} />
            {refresh.isPending ? 'Atualizando…' : 'Atualizar Preços'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => gerarSnapshot.mutate()}
            disabled={gerarSnapshot.isPending}
          >
            <RefreshCw size={14} className={`inline mr-1.5 ${gerarSnapshot.isPending ? 'animate-spin' : ''}`} />
            {gerarSnapshot.isPending ? 'Salvando…' : 'Snapshot'}
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Total Investido</p>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{BRL(grandTotal)}</p>
        </Card>
        {byType.map(g => (
          <Card key={g.type} className="!p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{TYPE_LABEL[g.type]}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{BRL(g.total)}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {grandTotal > 0 ? ((g.total / grandTotal) * 100).toFixed(1) : '0'}% da carteira
            </p>
          </Card>
        ))}
      </div>

      {/* Alocação — PieChart */}
      {pieData.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Alocação por Tipo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                paddingAngle={3}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => BRL(v)}
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend
                formatter={name => (
                  <span className="text-xs text-gray-600 dark:text-slate-300">{name}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Tabelas por tipo */}
      {byType.map(g => {
        const isFii = g.type === 'FII'
        const isTreasury = g.type === 'TREASURY'

        const sortedItems = g.items.slice().sort((a, b) => {
          if (isFii) {
            if (sortFii === 'pvp') {
              const ma = fiiMetricaMap[a.ticker]?.pvp ?? Infinity
              const mb = fiiMetricaMap[b.ticker]?.pvp ?? Infinity
              return ma - mb // menor P/VP primeiro
            }
            if (sortFii === 'dy') {
              const ma = fiiMetricaMap[a.ticker]?.dividendYield ?? -1
              const mb = fiiMetricaMap[b.ticker]?.dividendYield ?? -1
              return mb - ma // maior DY primeiro
            }
          }
          return b.totalValue - a.totalValue
        })

        const SortBtn = ({ field, label }: { field: SortFii; label: string }) => (
          <button onClick={() => setSortFii(field)}
            className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
              sortFii === field
                ? 'bg-accent-500 text-white font-semibold'
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
            }`}>
            {label}
          </button>
        )

        return (
        <Card key={g.type}>
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                {TYPE_LABEL[g.type]}
              </h3>
              <Badge color={TYPE_BADGE[g.type]}>
                {g.items.length} {g.items.length === 1 ? 'ativo' : 'ativos'}
              </Badge>
            </div>
            {isFii && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 dark:text-slate-500 mr-1">Ordenar:</span>
                <SortBtn field="totalValue" label="Total" />
                <SortBtn field="pvp" label="P/VP ↑" />
                <SortBtn field="dy" label="DY ↓" />
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700">
                  <th className="pb-2 font-medium">Ticker</th>
                  {isTreasury && <th className="pb-2 font-medium">Produto</th>}
                  {isTreasury && <th className="pb-2 font-medium">Indexador</th>}
                  {isTreasury && <th className="pb-2 font-medium">Vencimento</th>}
                  {!isTreasury && <th className="pb-2 font-medium text-right">Qtd</th>}
                  {!isTreasury && <th className="pb-2 font-medium text-right">Preço Atual</th>}
                  {isFii && <th className="pb-2 font-medium text-right">P/VP</th>}
                  {isFii && <th className="pb-2 font-medium text-right">DY</th>}
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium text-right">P&L</th>
                  <th className="pb-2 font-medium text-right">% Carteira</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {sortedItems.map(pos => {
                  const metrica = isFii ? fiiMetricaMap[pos.ticker] : null
                  return (
                    <tr key={pos.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-2.5 font-mono font-semibold text-gray-900 dark:text-slate-100">
                        {pos.ticker}
                      </td>
                      {isTreasury && (
                        <td className="py-2.5 text-gray-600 dark:text-slate-300 max-w-[180px] truncate">
                          {pos.productName ?? '—'}
                        </td>
                      )}
                      {isTreasury && (
                        <td className="py-2.5">
                          <Badge color="amber">{pos.indexer ?? '—'}</Badge>
                        </td>
                      )}
                      {isTreasury && (
                        <td className="py-2.5 text-gray-500 dark:text-slate-400 text-xs">
                          {pos.maturityDate ?? '—'}
                        </td>
                      )}
                      {!isTreasury && (
                        <td className="py-2.5 text-right text-gray-600 dark:text-slate-300">
                          {NUM(pos.quantity)}
                        </td>
                      )}
                      {!isTreasury && (
                        <td className="py-2.5 text-right text-gray-600 dark:text-slate-300">
                          {pos.currentPrice != null ? BRL(pos.currentPrice) : '—'}
                        </td>
                      )}
                      {isFii && (
                        <td className="py-2.5 text-right text-xs">
                          {metrica?.pvp != null ? (
                            <span className={metrica.pvp < 1 ? 'text-accent-600 dark:text-accent-400 font-semibold' : 'text-gray-500 dark:text-slate-400'}>
                              {metrica.pvp.toFixed(2)}
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      {isFii && (
                        <td className="py-2.5 text-right text-xs font-semibold text-accent-600 dark:text-accent-400">
                          {metrica?.dividendYield != null ? `${metrica.dividendYield.toFixed(2)}%` : '—'}
                        </td>
                      )}
                      <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-slate-100">
                        {BRL(pos.totalValue)}
                      </td>
                      <td className="py-2.5 text-right text-xs">
                        <div className="flex flex-col items-end">
                          <PnlBadge pnlPercent={pos.pnlPercent} />
                          <span className="text-gray-400 dark:text-slate-500">
                            <PnlNominal pnlNominal={pos.pnlNominal} />
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-gray-400 dark:text-slate-500 text-xs">
                        {grandTotal > 0 ? ((pos.totalValue / grandTotal) * 100).toFixed(1) : '0'}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-slate-600">
                  <td
                    colSpan={isFii ? 7 : isTreasury ? 5 : 5}
                    className="pt-2.5 text-xs font-semibold text-gray-500 dark:text-slate-400"
                  >
                    Subtotal
                  </td>
                  <td className="pt-2.5 text-right font-bold text-gray-900 dark:text-slate-100">
                    {BRL(g.total)}
                  </td>
                  <td className="pt-2.5 text-right text-xs font-semibold text-gray-500 dark:text-slate-400">
                    {grandTotal > 0 ? ((g.total / grandTotal) * 100).toFixed(1) : '0'}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )
    })}
    </div>
  )
}

// ─── Importar Tab ─────────────────────────────────────────────────────────────

function ImportarTab() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [refDate, setRefDate] = useState(today())
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [hasError, setHasError] = useState(false)

  const importar = useMutation({
    mutationFn: () => investimentosApi.importar(file!, refDate),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['investments', 'summary', activeProfile?.id] })
      setImportResult(result)
      setHasError(false)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: (err: any) => {
      setHasError(true)
      setImportResult(null)
      setErrorMsg(
        err?.response?.data?.message ??
        err?.message ??
        'Erro ao importar o arquivo.',
      )
    },
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportResult(null)
    setHasError(false)
    setFile(e.target.files?.[0] ?? null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">
          Importar Extrato B3
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">
          Selecione o arquivo <strong>XLSX</strong> ou <strong>CSV</strong> exportado pelo site da B3
          (Ações/FIIs ou Tesouro Direto) e informe a data de referência da posição.
        </p>

        <div className="space-y-4">
          {/* Data de referência */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Data de Referência
            </label>
            <input
              type="date"
              value={refDate}
              max={today()}
              onChange={e => setRefDate(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          {/* Drop zone */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Arquivo XLSX ou CSV
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`
                flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed
                rounded-xl cursor-pointer transition-colors
                ${file
                  ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/10'
                  : 'border-gray-300 dark:border-slate-600 hover:border-accent-400 dark:hover:border-accent-500 bg-gray-50 dark:bg-slate-900/50'
                }
              `}
            >
              <Upload
                size={24}
                className={file ? 'text-accent-500' : 'text-gray-400 dark:text-slate-500'}
              />
              {file ? (
                <span className="text-sm font-medium text-accent-600 dark:text-accent-400">
                  {file.name}
                </span>
              ) : (
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  Clique para selecionar o arquivo
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-slate-500">.xlsx · .csv</span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={() => { setImportResult(null); setHasError(false); importar.mutate() }}
            disabled={!file || !refDate || importar.isPending || !activeProfile}
          >
            {importar.isPending ? 'Importando…' : 'Importar'}
          </Button>
        </div>
      </Card>

      {/* Feedback sucesso */}
      {importResult && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
          <CheckCircle2 size={18} className="text-accent-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-accent-700 dark:text-accent-300">
              Importação concluída
            </p>
            <p className="text-xs text-accent-600 dark:text-accent-400 mt-0.5">
              {importResult.imported} posição(ões) importada(s)
              {importResult.skipped > 0 && `, ${importResult.skipped} já existia(m) e foi(ram) ignorada(s)`}.
            </p>
          </div>
        </div>
      )}

      {/* Feedback erro */}
      {hasError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
          <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
              Falha na importação
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Instruções */}
      <Card>
        <h4 className="text-xs font-semibold text-gray-600 dark:text-slate-300 mb-3 uppercase tracking-wide">
          Como exportar da B3
        </h4>
        <ol className="text-xs text-gray-500 dark:text-slate-400 space-y-2 list-decimal list-inside">
          <li>
            Acesse <span className="font-mono">investidor10.com.br</span> ou o portal B3
          </li>
          <li>Vá em <strong>Minha Carteira → Posição</strong></li>
          <li>Clique em <strong>Exportar / Download</strong> — escolha <strong>XLSX</strong> (preferido) ou CSV</li>
          <li>
            Para Tesouro Direto, acesse{' '}
            <span className="font-mono">tesourodireto.com.br</span> e exporte separadamente
          </li>
          <li>
            Importe cada arquivo individualmente informando a data de referência
          </li>
        </ol>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
          <strong>Idempotente:</strong> importar o mesmo arquivo duas vezes não duplica posições.
        </p>
      </Card>
    </div>
  )
}

// ─── Histórico Tab ────────────────────────────────────────────────────────────

const BENCHMARKS = [
  { key: 'cdi',  label: 'CDI',  color: '#f59e0b' },
  { key: 'ipca', label: 'IPCA', color: '#ec4899' },
  { key: 'ibov', label: 'IBOV', color: '#8b5cf6' },
] as const

function HistoricoTab() {
  const { activeProfile } = useProfile()
  const { theme } = useTheme()
  const [meses, setMeses] = useState(12)
  const [benchmarksAtivos, setBenchmarksAtivos] = useState<Set<string>>(new Set(['cdi']))

  const { data, isLoading } = useQuery({
    queryKey: ['investments', 'historico', activeProfile?.id, meses],
    queryFn: () => investimentosApi.historico(meses),
    enabled: !!activeProfile,
  })

  const { data: benchData } = useQuery({
    queryKey: ['benchmarks', 'historico', activeProfile?.id, meses],
    queryFn: () => benchmarksApi.historico(meses),
    enabled: !!activeProfile,
  })

  const pontos = data?.pontos ?? []

  const axisColor  = theme === 'dark' ? '#94a3b8' : '#6b7280'
  const gridColor  = theme === 'dark' ? '#1e293b' : '#f3f4f6'
  const tooltipStyle = theme === 'dark'
    ? { background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }
    : { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12 }

  const ultimoPonto = pontos[pontos.length - 1]
  const pnlTotal    = ultimoPonto ? ultimoPonto.pnlNominal : 0
  const pnlPositivo = pnlTotal >= 0

  // Calcula rentabilidade % da carteira para o gráfico de comparação
  const primeiroAtual  = pontos[0]?.totalAtual ?? 0
  const benchPontos = pontos.map(p => {
    const carteiraPct = primeiroAtual > 0 ? ((p.totalAtual / primeiroAtual) - 1) * 100 : 0
    const bench = benchData?.pontos.find(b => b.data === p.data.toString())
    return {
      label: p.label,
      carteira: parseFloat(carteiraPct.toFixed(2)),
      cdi:  bench?.cdi  ?? null,
      ipca: bench?.ipca ?? null,
      ibov: bench?.ibov ?? null,
    }
  })

  const toggleBenchmark = (key: string) => {
    setBenchmarksAtivos(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500 dark:text-slate-400">Período:</span>
        {[3, 6, 12].map(m => (
          <button key={m} onClick={() => setMeses(m)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              meses === m
                ? 'bg-accent-500 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}>{m}M</button>
        ))}
      </div>

      {/* Cards de resumo */}
      {ultimoPonto && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="!p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Custo total</p>
            <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{BRL(ultimoPonto.totalInvestido)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Valor atual</p>
            <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{BRL(ultimoPonto.totalAtual)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">P&L acumulado</p>
            <p className={`text-lg font-bold ${pnlPositivo ? 'text-accent-500' : 'text-rose-500'}`}>
              {pnlPositivo ? '+' : ''}{BRL(pnlTotal)}
            </p>
          </Card>
        </div>
      )}

      {/* Gráfico de área — evolução em R$ */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Evolução do Patrimônio</h3>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-400 dark:text-slate-500">Carregando…</div>
        ) : pontos.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-slate-500">
            <BarChart2 size={40} className="opacity-30" />
            <p className="text-sm text-center">Nenhum snapshot registrado ainda.<br />Importe posições ou atualize os preços para começar a acumular o histórico.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={pontos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradInvestido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradAtual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} width={56} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [BRL(v), name === 'totalInvestido' ? 'Custo' : 'Valor Atual']} />
              <Area type="monotone" dataKey="totalInvestido" stroke="#6366f1" strokeWidth={2} fill="url(#gradInvestido)" dot={false} name="totalInvestido" />
              <Area type="monotone" dataKey="totalAtual"    stroke="#10b981" strokeWidth={2} fill="url(#gradAtual)"    dot={false} name="totalAtual" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Gráfico de comparação % vs benchmarks */}
      {benchPontos.length > 1 && (
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Rentabilidade vs Benchmarks
            </h3>
            <div className="flex gap-2 flex-wrap">
              {BENCHMARKS.map(b => (
                <button key={b.key} onClick={() => toggleBenchmark(b.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    benchmarksAtivos.has(b.key)
                      ? 'border-transparent text-white'
                      : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 bg-transparent'
                  }`}
                  style={benchmarksAtivos.has(b.key) ? { background: b.color } : {}}>
                  <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={benchPontos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} width={56} />
              <Tooltip contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`,
                  name === 'carteira' ? 'Minha Carteira' : name.toUpperCase(),
                ]} />
              <Line type="monotone" dataKey="carteira" stroke="#10b981" strokeWidth={2.5} dot={false} name="carteira" />
              {BENCHMARKS.filter(b => benchmarksAtivos.has(b.key)).map(b => (
                <Line key={b.key} type="monotone" dataKey={b.key} stroke={b.color}
                  strokeWidth={1.5} strokeDasharray="4 3" dot={false} name={b.key}
                  connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
            Rentabilidade % acumulada desde o início do período. Carteira = variação do valor atual.
          </p>
        </Card>
      )}
    </div>
  )
}

// ─── Benchmark Tab ────────────────────────────────────────────────────────────

const SERIES = [
  { key: 'carteira', label: 'Minha Carteira', color: '#10b981', dash: false  },
  { key: 'ibov',     label: 'IBOV (BOVA11)',  color: '#8b5cf6', dash: true   },
  { key: 'cdi',      label: 'CDI',            color: '#f59e0b', dash: true   },
  { key: 'ipca',     label: 'IPCA',           color: '#ec4899', dash: true   },
] as const

const PERIODOS = [
  { label: '1M',  meses: 1  },
  { label: '3M',  meses: 3  },
  { label: '6M',  meses: 6  },
  { label: '1A',  meses: 12 },
  { label: '2A',  meses: 24 },
]

function BenchmarkTab() {
  const { activeProfile } = useProfile()
  const { theme } = useTheme()
  const [meses, setMeses] = useState(12)
  const [seriesAtivas, setSeriesAtivas] = useState<Set<string>>(new Set(['carteira', 'ibov', 'cdi']))

  const { data: bench, isLoading } = useQuery({
    queryKey: ['benchmarks', 'historico', activeProfile?.id, meses],
    queryFn: () => benchmarksApi.historico(meses),
    enabled: !!activeProfile,
    staleTime: 10 * 60 * 1000,
  })

  const axisColor    = theme === 'dark' ? '#94a3b8' : '#6b7280'
  const gridColor    = theme === 'dark' ? '#1e293b' : '#f3f4f6'
  const tooltipStyle = theme === 'dark'
    ? { background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }
    : { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12 }

  const pontos = bench?.pontos ?? []

  const toggle = (key: string) => {
    setSeriesAtivas(prev => {
      const next = new Set(prev)
      // Carteira sempre visível
      if (key === 'carteira') return next
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Retorno final de cada série (último ponto)
  const ultimo = pontos[pontos.length - 1]
  const retornos = SERIES.map(s => ({
    ...s,
    retorno: ultimo ? (ultimo[s.key as keyof typeof ultimo] as number | null) : null,
  }))

  const temDados = pontos.length > 1

  return (
    <div className="space-y-6">
      {/* Seletor de período */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Benchmark da Carteira</h2>
        <div className="flex gap-1">
          {PERIODOS.map(p => (
            <button key={p.meses} onClick={() => setMeses(p.meses)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                meses === p.meses
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Cards de retorno final */}
      {temDados && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {retornos.map(s => {
            const v = s.retorno
            const pos = v !== null && v >= 0
            return (
              <Card key={s.key} className="!p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{s.label}</p>
                </div>
                <p className={`text-xl font-bold ${
                  v === null ? 'text-gray-400 dark:text-slate-500' :
                  pos ? 'text-accent-600 dark:text-accent-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {v === null ? '—' : `${pos ? '+' : ''}${v.toFixed(2)}%`}
                </p>
                {s.key === 'carteira' && v !== null && retornos.find(r => r.key === 'ibov')?.retorno !== null && (
                  <p className="text-xs mt-1 text-gray-400 dark:text-slate-500">
                    vs IBOV: {((v - (retornos.find(r => r.key === 'ibov')!.retorno ?? 0)) >= 0 ? '+' : '')}
                    {(v - (retornos.find(r => r.key === 'ibov')!.retorno ?? 0)).toFixed(2)}pp
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Gráfico principal */}
      <Card>
        {/* Toggles de série */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            % acumulado desde o início do período — base 0%
          </p>
          <div className="flex gap-2 flex-wrap">
            {SERIES.map(s => (
              <button key={s.key} onClick={() => toggle(s.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  seriesAtivas.has(s.key)
                    ? 'border-transparent text-white'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 bg-transparent'
                } ${s.key === 'carteira' ? 'cursor-default' : 'cursor-pointer'}`}
                style={seriesAtivas.has(s.key) ? { background: s.color } : {}}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-72 flex items-center justify-center text-gray-400 dark:text-slate-500">
            Buscando dados de CDI, IPCA e IBOV…
          </div>
        ) : !temDados ? (
          <div className="h-72 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-slate-500">
            <BarChart2 size={40} className="opacity-30" />
            <p className="text-sm text-center">
              Nenhum snapshot de patrimônio disponível para o período.<br />
              Gere um snapshot na aba <strong>Carteira</strong> e tente novamente.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={pontos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false}
                interval="preserveStartEnd" />
              <YAxis tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} width={56} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: unknown, name: string) => {
                  if (v === null || v === undefined || typeof v !== 'number') return ['—', name]
                  const s = SERIES.find(s => s.key === name)
                  return [`${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, s?.label ?? name]
                }}
              />
              {SERIES.filter(s => seriesAtivas.has(s.key)).map(s => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={s.key === 'carteira' ? 2.5 : 1.5}
                  strokeDasharray={s.dash ? '5 3' : undefined}
                  dot={false}
                  connectNulls
                  name={s.key}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {!isLoading && temDados && (
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
          CDI e IPCA via Banco Central do Brasil · IBOV via BOVA11 (Brapi) · dados podem ter atraso de 1 dia útil
        </p>
      )}
    </div>
  )
}

// ─── Alertas de Preço Tab ─────────────────────────────────────────────────────
const BRL_COMPACT = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function AlertasTab() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ticker: '', precoAlvo: '', direcao: 'ACIMA' as Direcao })

  const { data: alertas = [], isLoading } = useQuery({
    queryKey: ['alertas-preco', activeProfile?.id],
    queryFn: alertasPrecoApi.listar,
    enabled: !!activeProfile,
    refetchInterval: 60_000,
  })

  const criar = useMutation({
    mutationFn: () => alertasPrecoApi.criar(form.ticker, parseFloat(form.precoAlvo), form.direcao),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alertas-preco'] }); setShowForm(false); setForm({ ticker: '', precoAlvo: '', direcao: 'ACIMA' }) },
  })
  const dispensar = useMutation({
    mutationFn: (id: number) => alertasPrecoApi.dispensar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alertas-preco'] }),
  })
  const deletar = useMutation({
    mutationFn: (id: number) => alertasPrecoApi.deletar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alertas-preco'] }),
  })

  const SELECT_CLS = 'bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500'

  const ativos = alertas.filter((a: AlertaPreco) => a.ativo && !a.disparadoEm)
  const disparados = alertas.filter((a: AlertaPreco) => a.ativo && a.disparadoEm)
  const inativos = alertas.filter((a: AlertaPreco) => !a.ativo)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(s => !s)}>
          <Plus size={16} className="inline mr-1" />Novo Alerta
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Novo Alerta de Preço</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Ticker" placeholder="Ex: PETR4" value={form.ticker}
              onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} />
            <Input label="Preço alvo (R$)" type="number" step="0.01" min="0.01" value={form.precoAlvo}
              onChange={e => setForm(f => ({ ...f, precoAlvo: e.target.value }))} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Direção</label>
              <select value={form.direcao} onChange={e => setForm(f => ({ ...f, direcao: e.target.value as Direcao }))} className={SELECT_CLS}>
                <option value="ACIMA">Acima do preço alvo</option>
                <option value="ABAIXO">Abaixo do preço alvo</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => criar.mutate()} disabled={!form.ticker || !form.precoAlvo || criar.isPending}>
              Criar Alerta
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-gray-500 dark:text-slate-400">Carregando…</p>
      ) : alertas.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Bell size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
            <p className="text-gray-400 dark:text-slate-500">Nenhum alerta cadastrado.</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Crie alertas para ser notificado quando um ativo atingir o preço-alvo.</p>
          </div>
        </Card>
      ) : (
        <>
          {disparados.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <Bell size={14} /> {disparados.length} alerta{disparados.length > 1 ? 's' : ''} disparado{disparados.length > 1 ? 's' : ''}
              </h3>
              <div className="space-y-2">
                {disparados.map((a: AlertaPreco) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div>
                      <span className="font-semibold text-amber-800 dark:text-amber-300">{a.ticker}</span>
                      <span className="text-sm text-amber-700 dark:text-amber-400 ml-2">
                        {a.direcao === 'ACIMA' ? '↑ acima de' : '↓ abaixo de'} {BRL_COMPACT(a.precoAlvo)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => dispensar.mutate(a.id)} disabled={dispensar.isPending}>
                        <CheckCircle2 size={15} className="mr-1" />OK
                      </Button>
                      <button onClick={() => deletar.mutate(a.id)} className="text-gray-400 hover:text-rose-500 transition p-1">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {ativos.length > 0 && (
            <div className="space-y-2">
              {ativos.map((a: AlertaPreco) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-slate-100">{a.ticker}</span>
                    <span className="text-sm text-gray-500 dark:text-slate-400 ml-2">
                      {a.direcao === 'ACIMA' ? '↑ acima de' : '↓ abaixo de'} {BRL_COMPACT(a.precoAlvo)}
                    </span>
                    <Badge>Monitorando</Badge>
                  </div>
                  <button onClick={() => deletar.mutate(a.id)} className="text-gray-300 dark:text-slate-600 hover:text-rose-500 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {inativos.length > 0 && (
            <>
              <h3 className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mt-4">
                <BellOff size={12} /> Dispensados
              </h3>
              <div className="space-y-1">
                {inativos.map((a: AlertaPreco) => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 opacity-50">
                    <span className="text-sm text-gray-500 dark:text-slate-500">
                      {a.ticker} — {a.direcao === 'ACIMA' ? '↑' : '↓'} {BRL_COMPACT(a.precoAlvo)}
                    </span>
                    <button onClick={() => deletar.mutate(a.id)} className="text-gray-300 dark:text-slate-700 hover:text-rose-400 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── Proventos Tab ────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<TipoProvento, string> = {
  DIVIDENDO:    'Dividendo',
  JCP:          'JCP',
  RENDIMENTO:   'Rendimento',
  AMORTIZACAO:  'Amortização',
}

const TIPO_COLOR: Record<TipoProvento, string> = {
  DIVIDENDO:   '#10b981',
  JCP:         '#6366f1',
  RENDIMENTO:  '#f59e0b',
  AMORTIZACAO: '#64748b',
}

// ─── Calendário de Proventos ──────────────────────────────────────────────────
function CalendarioProventos() {
  const { activeProfile } = useProfile()
  const [meses, setMeses] = useState<3 | 6 | 12>(3)

  const { data: calendario = [], isLoading } = useQuery({
    queryKey: ['proventos', 'calendario', activeProfile?.id, meses],
    queryFn: () => proventosApi.calendario(meses),
    enabled: !!activeProfile,
  })

  const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const hoje = new Date().toISOString().slice(0, 10)

  if (isLoading) return (
    <div className="h-48 flex items-center justify-center text-gray-400 dark:text-slate-500">Carregando…</div>
  )

  if (!calendario.length) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 dark:text-slate-500">
      <DollarSign size={40} className="opacity-30" />
      <p className="text-sm text-center">Nenhum provento nos próximos {meses} meses.<br />Importe seus proventos para visualizar o calendário.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Seletor de período */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {calendario.length} {calendario.length === 1 ? 'mês' : 'meses'} com proventos
        </p>
        <div className="flex gap-1">
          {([3, 6, 12] as const).map(m => (
            <button
              key={m}
              onClick={() => setMeses(m)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                meses === m
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Cards por mês */}
      <div className="space-y-4">
        {calendario.map((mes: CalendarioMes) => {
          const isCurrent = mes.mes === hoje.slice(0, 7)
          return (
            <div
              key={mes.mes}
              className={`rounded-2xl border ${
                mes.passado
                  ? 'border-gray-200 dark:border-slate-700 opacity-70'
                  : isCurrent
                    ? 'border-accent-400 dark:border-accent-500 ring-1 ring-accent-400/30'
                    : 'border-gray-200 dark:border-slate-700'
              }`}
            >
              {/* Cabeçalho do mês */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${
                mes.passado
                  ? 'bg-gray-50 dark:bg-slate-800/50'
                  : isCurrent
                    ? 'bg-accent-500/8 dark:bg-accent-500/10'
                    : 'bg-gray-50 dark:bg-slate-800/50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-slate-100">{mes.mesLabel}</span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-accent-500 text-white rounded-full">
                      Este mês
                    </span>
                  )}
                  {mes.passado && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">
                      Recebido
                    </span>
                  )}
                </div>
                <span className={`font-bold text-base ${mes.passado ? 'text-gray-500 dark:text-slate-400' : 'text-accent-600 dark:text-accent-400'}`}>
                  {BRL(mes.total)}
                </span>
              </div>

              {/* Lista de proventos */}
              <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {mes.itens.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: TIPO_COLOR[item.tipo] }}
                      />
                      <span className="font-medium text-sm text-gray-900 dark:text-slate-100">{item.ticker}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 hidden sm:inline">
                        {TIPO_LABEL[item.tipo]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {new Date(item.dataPagamento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <span className={`text-sm font-semibold ${item.recebido ? 'text-gray-500 dark:text-slate-400' : 'text-gray-900 dark:text-slate-100'}`}>
                        {BRL(item.valor)}
                      </span>
                      {item.recebido
                        ? <CheckCircle2 size={14} className="text-accent-500 flex-shrink-0" />
                        : <Circle size={14} className="text-gray-300 dark:text-slate-600 flex-shrink-0" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProventosTab() {
  const { activeProfile } = useProfile()
  const { theme } = useTheme()
  const qc = useQueryClient()
  const csvRef = useRef<HTMLInputElement>(null)
  const [subTab, setSubTab] = useState<'Resumo' | 'Calendário' | 'Histórico'>('Resumo')
  const [showForm, setShowForm] = useState(false)
  const [importMsg, setImportMsg] = useState<ProventoImportResult | null>(null)
  const [form, setForm] = useState({
    ticker: '', tipo: 'DIVIDENDO' as TipoProvento,
    valor: '', dataPagamento: new Date().toISOString().slice(0, 10), dataCom: '',
  })

  const { data: resumo, isLoading } = useQuery({
    queryKey: ['proventos', 'resumo', activeProfile?.id],
    queryFn: proventosApi.resumo,
    enabled: !!activeProfile,
  })

  const { data: lista = [] } = useQuery({
    queryKey: ['proventos', 'lista', activeProfile?.id],
    queryFn: () => proventosApi.listar(),
    enabled: !!activeProfile,
  })

  const { data: projecao } = useQuery({
    queryKey: ['proventos', 'projecao', activeProfile?.id],
    queryFn: proventosApi.projecao,
    enabled: !!activeProfile,
  })

  const criar = useMutation({
    mutationFn: () => proventosApi.criar({
      ticker: form.ticker.toUpperCase(),
      tipo: form.tipo,
      valor: parseFloat(form.valor),
      dataPagamento: form.dataPagamento,
      dataCom: form.dataCom || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proventos'] })
      setShowForm(false)
      setForm({ ticker: '', tipo: 'DIVIDENDO', valor: '', dataPagamento: new Date().toISOString().slice(0, 10), dataCom: '' })
    },
  })

  const deletar = useMutation({
    mutationFn: (id: number) => proventosApi.deletar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proventos'] }),
  })

  const importCsv = useMutation({
    mutationFn: (file: File) => proventosApi.importarCsv(file),
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: ['proventos'] })
      setImportMsg(result)
    },
  })

  const axisColor        = theme === 'dark' ? '#94a3b8' : '#6b7280'
  const tooltipLabelStyle = theme === 'dark' ? { color: '#f1f5f9' } : { color: '#111827' }
  const tooltipStyle = theme === 'dark'
    ? { background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }
    : { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12 }

  const SELECT_CLS = 'bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500'

  // Últimos 12 meses agrupados por tipo para o gráfico empilhado
  const chartData = (() => {
    const tipos: TipoProvento[] = ['DIVIDENDO', 'JCP', 'RENDIMENTO', 'AMORTIZACAO']
    // Pegar todos os meses presentes na lista, ordenar e pegar últimos 12
    const mesesSet = new Set(lista.map(p => p.dataPagamento.slice(0, 7)))
    const meses = [...mesesSet].sort().slice(-12)
    return meses.map(mes => {
      const row: Record<string, string | number> = { mes }
      tipos.forEach(tipo => {
        row[tipo] = lista
          .filter(p => p.dataPagamento.slice(0, 7) === mes && p.tipo === tipo)
          .reduce((s, p) => s + p.valor, 0)
      })
      return row
    })
  })()

  if (isLoading) return <p className="text-gray-500 dark:text-slate-400 text-sm">Carregando…</p>

  const totalAllTime = resumo?.totalAllTime ?? 0
  const media12      = resumo?.mediaUltimos12Meses ?? 0

  return (
    <div className="space-y-6">
      {/* Header com botão */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="!p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Total Recebido</p>
            <p className="text-lg font-bold text-accent-500">{BRL(totalAllTime)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Média Mensal (12m)</p>
            <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{BRL(media12)}</p>
          </Card>
          <Card className="!p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Tickers com Proventos</p>
            <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {resumo?.porTicker.length ?? 0}
            </p>
          </Card>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="ghost" onClick={() => csvRef.current?.click()} disabled={importCsv.isPending}>
              <Upload size={14} className="inline mr-1.5" />
              {importCsv.isPending ? 'Importando…' : 'Importar CSV B3'}
            </Button>
            <Button onClick={() => setShowForm(s => !s)}>
              <Plus size={15} className="inline mr-1.5" />Registrar
            </Button>
          </div>
          {importMsg && (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              <CheckCircle2 size={12} className="inline mr-1 text-accent-500" />
              {importMsg.imported} importado(s), {importMsg.skipped} ignorado(s)
            </p>
          )}
          <input ref={csvRef} type="file" accept=".csv,.xlsx,.txt" className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) { setImportMsg(null); importCsv.mutate(f) }
              e.target.value = ''
            }} />
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700">
        {(['Resumo', 'Calendário', 'Histórico'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setSubTab(t); setShowForm(false) }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              subTab === t
                ? 'border-accent-500 text-accent-600 dark:text-accent-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Calendário ── */}
      {subTab === 'Calendário' && <CalendarioProventos />}

      {/* ── Resumo ── */}
      {subTab === 'Resumo' && (
        totalAllTime === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 dark:text-slate-500 gap-3">
            <DollarSign size={48} className="opacity-30" />
            <p className="text-base font-medium">Nenhum provento registrado ainda.</p>
            <p className="text-sm">Vá para <strong>Histórico</strong> para registrar seus primeiros proventos.</p>
          </div>
        ) : (
          <>
            {chartData.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Renda Passiva Mensal</h3>
                  <div className="flex gap-3 flex-wrap justify-end">
                    {(Object.keys(TIPO_LABEL) as TipoProvento[]).map(tipo => (
                      <div key={tipo} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: TIPO_COLOR[tipo] }} />
                        <span className="text-xs text-gray-500 dark:text-slate-400">{TIPO_LABEL[tipo]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={theme === 'dark' ? '#1e293b' : '#f3f4f6'} vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} width={52} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipLabelStyle}
                      formatter={(v: number, name: string) =>
                        v > 0 ? [BRL(v), TIPO_LABEL[name as TipoProvento]] : ['', '']
                      }
                    />
                    <Bar dataKey="DIVIDENDO"   stackId="a" fill={TIPO_COLOR.DIVIDENDO}   name="DIVIDENDO"   />
                    <Bar dataKey="RENDIMENTO"  stackId="a" fill={TIPO_COLOR.RENDIMENTO}  name="RENDIMENTO"  />
                    <Bar dataKey="JCP"         stackId="a" fill={TIPO_COLOR.JCP}         name="JCP"         />
                    <Bar dataKey="AMORTIZACAO" stackId="a" fill={TIPO_COLOR.AMORTIZACAO} name="AMORTIZACAO" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {(resumo?.porTicker.length ?? 0) > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Por Ticker</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700">
                        <th className="pb-2 font-medium">Ticker</th>
                        <th className="pb-2 font-medium text-right">Total Recebido</th>
                        <th className="pb-2 font-medium text-right">Yield on Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                      {resumo!.porTicker.map(t => (
                        <tr key={t.ticker} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-2.5 font-mono font-semibold text-gray-900 dark:text-slate-100">{t.ticker}</td>
                          <td className="py-2.5 text-right font-semibold text-accent-600 dark:text-accent-400">{BRL(t.totalRecebido)}</td>
                          <td className="py-2.5 text-right text-gray-500 dark:text-slate-400">
                            {t.yieldOnCost != null ? `${t.yieldOnCost.toFixed(2)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {(projecao?.totalMensalProjetado ?? 0) > 0 && (
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Projeção de Renda Passiva</h3>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      Baseada na média dos últimos 12 meses por ticker
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 dark:text-slate-500">Mensal projetado</p>
                    <p className="text-xl font-bold text-accent-500">{BRL(projecao!.totalMensalProjetado)}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      Anual: <span className="font-semibold text-gray-700 dark:text-slate-300">{BRL(projecao!.totalAnualProjetado)}</span>
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {projecao!.porTicker.map(t => {
                    const pct = projecao!.totalMensalProjetado > 0
                      ? (t.mediaMensal / projecao!.totalMensalProjetado) * 100
                      : 0
                    return (
                      <div key={t.ticker}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">{t.ticker}</span>
                          <span className="font-semibold text-gray-900 dark:text-slate-100">
                            {BRL(t.mediaMensal)}<span className="text-gray-400 dark:text-slate-500 font-normal">/mês</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                          <div className="bg-accent-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </>
        )
      )}

      {/* ── Histórico ── */}
      {subTab === 'Histórico' && (
        <>
          {showForm && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-slate-100">Novo Provento</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Input label="Ticker" placeholder="Ex: PETR4"
                  value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoProvento }))} className={SELECT_CLS}>
                    {(Object.keys(TIPO_LABEL) as TipoProvento[]).map(t => (
                      <option key={t} value={t}>{TIPO_LABEL[t]}</option>
                    ))}
                  </select>
                </div>
                <Input label="Valor Total (R$)" type="number" step="0.01" min="0.01" placeholder="0,00"
                  value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Data Pagamento</label>
                  <input type="date" value={form.dataPagamento}
                    onChange={e => setForm(f => ({ ...f, dataPagamento: e.target.value }))}
                    className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Data COM <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input type="date" value={form.dataCom}
                    onChange={e => setForm(f => ({ ...f, dataCom: e.target.value }))}
                    className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => criar.mutate()}
                  disabled={!form.ticker || !form.valor || !form.dataPagamento || criar.isPending}>
                  {criar.isPending ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
            </Card>
          )}

          {lista.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 dark:text-slate-500 gap-3">
              <DollarSign size={48} className="opacity-30" />
              <p className="text-base font-medium">Nenhum provento registrado ainda.</p>
              <p className="text-sm">Clique em <strong>Registrar</strong> acima para começar.</p>
            </div>
          ) : lista.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Histórico completo ({lista.length})</h3>
                <button
                  onClick={() => exportCsv(
                    `proventos_${new Date().toISOString().slice(0,10)}.csv`,
                    lista.map(p => [p.ticker, TIPO_LABEL[p.tipo], p.dataPagamento, p.dataCom ?? '', String(p.valor.toFixed(2))]),
                    ['Ticker', 'Tipo', 'Data Pagamento', 'Data COM', 'Valor']
                  )}
                  className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                >
                  <Download size={13} />CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700">
                      <th className="pb-2 font-medium">Ticker</th>
                      <th className="pb-2 font-medium">Tipo</th>
                      <th className="pb-2 font-medium">Pagamento</th>
                      <th className="pb-2 font-medium">COM</th>
                      <th className="pb-2 font-medium text-right">Valor</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {lista.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-2.5 font-mono font-semibold text-gray-900 dark:text-slate-100">{p.ticker}</td>
                        <td className="py-2.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: TIPO_COLOR[p.tipo] + '22', color: TIPO_COLOR[p.tipo] }}>
                            {TIPO_LABEL[p.tipo]}
                          </span>
                        </td>
                        <td className="py-2.5 text-gray-500 dark:text-slate-400">{p.dataPagamento}</td>
                        <td className="py-2.5 text-gray-400 dark:text-slate-500">{p.dataCom ?? '—'}</td>
                        <td className="py-2.5 text-right font-semibold text-accent-600 dark:text-accent-400">{BRL(p.valor)}</td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => deletar.mutate(p.id)}
                            className="text-gray-300 dark:text-slate-600 hover:text-rose-500 transition">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ─── Painel Lateral ───────────────────────────────────────────────────────────

function PainelLateral() {
  const { activeProfile } = useProfile()
  const { data } = useQuery({
    queryKey: ['investments', 'summary', activeProfile?.id],
    queryFn: investimentosApi.summary,
    enabled: !!activeProfile,
  })

  const positions = data?.positions ?? []
  if (positions.length === 0) return null

  const grandTotal = data?.grandTotal ?? 0

  const totalInvested = positions.reduce((acc, p) => acc + (p.investedValue ?? p.totalValue ?? 0), 0)
  const totalCurrent  = positions.reduce((acc, p) => acc + (p.currentValue  ?? p.totalValue ?? 0), 0)
  const totalPnlNominal = totalCurrent - totalInvested
  const totalPnlPercent = totalInvested > 0 ? (totalPnlNominal / totalInvested) * 100 : 0
  const pnlPositivo = totalPnlNominal >= 0

  const withPnl = positions
    .filter(p => p.pnlPercent !== null)
    .sort((a, b) => (b.pnlPercent ?? 0) - (a.pnlPercent ?? 0))
  const topGanhos = withPnl.filter(p => (p.pnlPercent ?? 0) > 0).slice(0, 3)
  const topPerdas  = [...withPnl].filter(p => (p.pnlPercent ?? 0) < 0).reverse().slice(0, 3)

  const allTypes2 = Array.from(new Set(positions.map(p => p.type))) as InvestmentType[]
  const byType = allTypes2
    .map(type => ({
      name: TYPE_LABEL[type],
      value: positions.filter(p => p.type === type).reduce((s, p) => s + (p.currentValue ?? p.totalValue), 0),
      color: TYPE_COLOR[type],
    }))
    .filter(g => g.value > 0)

  return (
    <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-6 self-start">
      {/* P&L Total */}
      <Card className="!p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          P&L Consolidado
        </p>
        <p className={`text-2xl font-bold ${pnlPositivo ? 'text-accent-500' : 'text-rose-500'}`}>
          {pnlPositivo ? '+' : ''}{BRL(totalPnlNominal)}
        </p>
        <p className={`text-sm font-semibold mt-0.5 ${pnlPositivo ? 'text-accent-400' : 'text-rose-400'}`}>
          {pnlPositivo ? '+' : ''}{totalPnlPercent.toFixed(2)}%
        </p>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-slate-400">Custo total</span>
            <span className="text-gray-700 dark:text-slate-300">{BRL(totalInvested)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-slate-400">Valor atual</span>
            <span className="font-semibold text-gray-900 dark:text-slate-100">{BRL(totalCurrent)}</span>
          </div>
        </div>
      </Card>

      {/* Top Ganhos */}
      {topGanhos.length > 0 && (
        <Card className="!p-4">
          <p className="text-xs font-semibold text-accent-600 dark:text-accent-400 uppercase tracking-wide mb-3">
            ↑ Maiores Ganhos
          </p>
          <div className="space-y-2.5">
            {topGanhos.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-slate-100">{p.ticker}</span>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {p.pnlNominal != null ? `+${BRL(p.pnlNominal)}` : ''}
                  </p>
                </div>
                <span className="text-sm font-bold text-accent-600 dark:text-accent-400">
                  +{(p.pnlPercent ?? 0).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Perdas */}
      {topPerdas.length > 0 && (
        <Card className="!p-4">
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-3">
            ↓ Maiores Perdas
          </p>
          <div className="space-y-2.5">
            {topPerdas.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-slate-100">{p.ticker}</span>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {p.pnlNominal != null ? BRL(p.pnlNominal) : ''}
                  </p>
                </div>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {(p.pnlPercent ?? 0).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mini donut alocação */}
      {byType.length > 0 && (
        <Card className="!p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Alocação
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={byType}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
                dataKey="value"
                paddingAngle={3}
              >
                {byType.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => BRL(v)}
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5">
            {byType.map(g => (
              <div key={g.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color }} />
                  <span className="text-gray-600 dark:text-slate-300">{g.name}</span>
                </div>
                <span className="font-medium text-gray-700 dark:text-slate-200">
                  {grandTotal > 0 ? ((g.value / grandTotal) * 100).toFixed(1) : '0'}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Rebalancear Tab ──────────────────────────────────────────────────────────

const CLASSE_LABEL: Record<string, string> = {
  STOCK: 'Ações', FII: 'FIIs', TREASURY: 'Tesouro Direto',
  BDR: 'BDRs', ETF: 'ETFs', ETF_INT: 'ETFs Internacionais',
  STOCK_INT: 'Ações Internacionais', RENDA_FIXA: 'Renda Fixa',
}

function RebalancearTab() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()

  const [aporteInput, setAporteInput] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AlvoRequest>({ label: '', tipo: 'CLASSE', percentualAlvo: 0 })

  const aporte = aporteInput ? parseFloat(aporteInput.replace(',', '.')) : undefined

  const { data: alvos = [] } = useQuery({
    queryKey: ['rebalanceamento', 'alvos', activeProfile?.id],
    queryFn: rebalanceamentoApi.listarAlvos,
    enabled: !!activeProfile,
  })

  const { data: calculo } = useQuery({
    queryKey: ['rebalanceamento', 'calculo', activeProfile?.id, aporte],
    queryFn: () => rebalanceamentoApi.calcular(aporte),
    enabled: !!activeProfile,
  })

  const salvar = useMutation({
    mutationFn: (body: AlvoRequest) => rebalanceamentoApi.salvarAlvo(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rebalanceamento'] })
      setShowForm(false)
      setForm({ label: '', tipo: 'CLASSE', percentualAlvo: 0 })
    },
  })

  const deletar = useMutation({
    mutationFn: (id: number) => rebalanceamentoApi.deletarAlvo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rebalanceamento'] }),
  })

  const totalAlvos = calculo?.totalAlvos ?? 0
  const totalCarteira = calculo?.totalCarteira ?? 0
  const itens = calculo?.itens ?? []
  const sobraAporte = aporte != null ? aporte - (calculo?.aporteTotal ?? 0) : null

  const SELECT_CLS = 'bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500'

  const diffColor = (v: number) =>
    v > 0.5 ? 'text-rose-600 dark:text-rose-400'
    : v < -0.5 ? 'text-accent-600 dark:text-accent-400'
    : 'text-gray-500 dark:text-slate-400'

  return (
    <div className="space-y-6">

      {/* Resumo alvo total */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="!p-4">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Total da Carteira</p>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{BRL(totalCarteira)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Alvos Definidos</p>
          <p className={`text-lg font-bold ${Math.abs(totalAlvos - 100) < 0.1 ? 'text-accent-500' : 'text-amber-500'}`}>
            {totalAlvos.toFixed(1)}%
          </p>
          {Math.abs(totalAlvos - 100) >= 0.1 && (
            <p className="text-xs text-amber-500 mt-0.5">ideal: 100%</p>
          )}
        </Card>
        <Card className="!p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Aporte para Rebalancear</p>
          <div className="relative mt-0.5">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
            <input
              type="number"
              min="0"
              step="100"
              placeholder="0,00"
              value={aporteInput}
              onChange={e => setAporteInput(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
        </Card>
      </div>

      {/* Tabela de rebalanceamento */}
      {itens.length > 0 ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Análise de Alocação</h3>
            {sobraAporte != null && sobraAporte > 0.01 && (
              <span className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                Sobra: {BRL(sobraAporte)} (itens já no alvo)
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700">
                  <th className="pb-2 font-medium">Ativo / Classe</th>
                  <th className="pb-2 font-medium text-right">Alvo</th>
                  <th className="pb-2 font-medium text-right">Atual %</th>
                  <th className="pb-2 font-medium text-right">Atual R$</th>
                  <th className="pb-2 font-medium text-right">Diferença</th>
                  {aporte != null && <th className="pb-2 font-medium text-right">Aportar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {itens.map(item => (
                  <tr key={item.label} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-gray-900 dark:text-slate-100">
                          {item.tipo === 'CLASSE' ? (CLASSE_LABEL[item.label] ?? item.label) : item.label}
                        </span>
                        {item.tipo === 'CLASSE' && (
                          <Badge color="slate">{item.label}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium text-gray-700 dark:text-slate-300">
                      {item.percentualAlvo.toFixed(1)}%
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-slate-300">
                      {item.percentualAtual.toFixed(1)}%
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-slate-300">
                      {BRL(item.valorAtual)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-semibold text-xs ${diffColor(item.diferencaPercent)}`}>
                          {item.diferencaPercent > 0 ? '+' : ''}{item.diferencaPercent.toFixed(1)}%
                        </span>
                        <span className={`text-xs ${diffColor(item.diferencaValor)}`}>
                          {item.diferencaValor > 0 ? '+' : ''}{BRL(item.diferencaValor)}
                        </span>
                      </div>
                    </td>
                    {aporte != null && (
                      <td className="py-3 text-right">
                        {item.sugestaoAporte > 0.01 ? (
                          <span className="font-semibold text-accent-600 dark:text-accent-400">
                            {BRL(item.sugestaoAporte)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : alvos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500 gap-3">
          <BarChart2 size={40} className="opacity-30" />
          <p className="text-sm font-medium">Nenhum alvo definido ainda.</p>
          <p className="text-xs">Adicione alvos abaixo para ver a análise de rebalanceamento.</p>
        </div>
      ) : null}

      {/* Alvos definidos */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Alvos de Alocação</h3>
          <Button onClick={() => setShowForm(s => !s)}>
            <Plus size={14} className="inline mr-1.5" />Novo Alvo
          </Button>
        </div>

        {showForm && (
          <div className="mb-5 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoAlvo, label: '' }))}
                  className={SELECT_CLS}
                >
                  <option value="CLASSE">Classe de Ativo</option>
                  <option value="TICKER">Ticker Específico</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400">
                  {form.tipo === 'CLASSE' ? 'Classe' : 'Ticker'}
                </label>
                {form.tipo === 'CLASSE' ? (
                  <select
                    value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    className={SELECT_CLS}
                  >
                    <option value="">Selecione…</option>
                    <option value="STOCK">Ações</option>
                    <option value="FII">FIIs</option>
                    <option value="TREASURY">Tesouro Direto</option>
                    <option value="BDR">BDRs</option>
                    <option value="ETF">ETFs</option>
                    <option value="ETF_INT">ETFs Internacionais</option>
                    <option value="STOCK_INT">Ações Internacionais</option>
                    <option value="RENDA_FIXA">Renda Fixa</option>
                  </select>
                ) : (
                  <Input
                    placeholder="Ex: PETR4"
                    value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value.toUpperCase() }))}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-slate-400">% Alvo</label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.5"
                    placeholder="Ex: 30"
                    value={form.percentualAlvo || ''}
                    onChange={e => setForm(f => ({ ...f, percentualAlvo: parseFloat(e.target.value) || 0 }))}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button
                onClick={() => salvar.mutate(form)}
                disabled={!form.label || form.percentualAlvo <= 0 || salvar.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        )}

        {alvos.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">
            Nenhum alvo definido. Clique em "Novo Alvo" para começar.
          </p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {alvos.map(alvo => (
              <div key={alvo.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {alvo.tipo === 'CLASSE' ? (CLASSE_LABEL[alvo.label] ?? alvo.label) : alvo.label}
                  </span>
                  <Badge color={alvo.tipo === 'CLASSE' ? 'slate' : 'accent'}>
                    {alvo.tipo === 'CLASSE' ? 'Classe' : 'Ticker'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                    {alvo.percentualAlvo.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => deletar.mutate(alvo.id)}
                    className="text-gray-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'Carteira' | 'Proventos' | 'Histórico' | 'Benchmark' | 'Alertas' | 'Rebalancear' | 'Importar'
const TABS: Tab[] = ['Carteira', 'Proventos', 'Histórico', 'Benchmark', 'Alertas', 'Rebalancear', 'Importar']

export default function InvestimentosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Carteira')
  const { activeProfile } = useProfile()

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-slate-500 text-sm">
        Selecione um perfil para ver os investimentos.
      </div>
    )
  }

  const showPanel = activeTab === 'Carteira' || activeTab === 'Proventos'

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Investimentos</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Carteira B3 — Ações, FIIs, BDRs, ETFs e Tesouro Direto
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content + painel lateral */}
      <div className={showPanel ? 'flex gap-6 items-start' : ''}>
        <div className="flex-1 min-w-0">
          {activeTab === 'Carteira'    && <CarteiraTab />}
          {activeTab === 'Proventos'  && <ProventosTab />}
          {activeTab === 'Histórico'  && <HistoricoTab />}
          {activeTab === 'Benchmark'  && <BenchmarkTab />}
          {activeTab === 'Alertas'    && <AlertasTab />}
          {activeTab === 'Rebalancear' && <RebalancearTab />}
          {activeTab === 'Importar'   && <ImportarTab />}
        </div>
        {showPanel && <PainelLateral />}
      </div>
    </div>
  )
}
