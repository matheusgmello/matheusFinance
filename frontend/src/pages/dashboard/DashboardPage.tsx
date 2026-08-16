import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardApi, ConsolidadoMes } from '../../domains/dashboard/api'
import { receitasApi } from '../../domains/dashboard/api/extra'
import { perfisApi } from '../../domains/configuracao/api'
import { useProfile } from '../../shared/context/ProfileContext'
import { useTheme } from '../../shared/context/ThemeContext'
import { Card, StatTile } from '../../shared/components/ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Layers, Pencil, Check, X } from 'lucide-react'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const PIE_COLORS = ['#3D7DFA', '#F2A93B', '#3DBF80', '#D9724A', '#8B7FD1', '#4FB8C9']

function chartTheme(isDark: boolean) {
  return {
    axisColor: isDark ? '#94989E' : '#5B5F66',
    tooltipStyle: {
      background: isDark ? '#1B1B1E' : '#F7F7F8',
      border: `1px solid ${isDark ? '#2D2D32' : '#C7C9CD'}`,
      borderRadius: 6,
      
      fontSize: 12,
    },
    tooltipLabelStyle: { color: isDark ? '#F2F2F2' : '#17181A' },
  }
}

function ResumoPainel() {
  const { activeProfile } = useProfile()
  const { isDark } = useTheme()
  const qc = useQueryClient()
  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth() + 1
  const [editandoReceita, setEditandoReceita] = useState(false)
  const [receitaInput, setReceitaInput] = useState('')

  const { axisColor, tooltipStyle, tooltipLabelStyle } = chartTheme(isDark)

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

  const salvarReceita = useMutation({
    mutationFn: () => receitasApi.salvar(ano, mes, parseFloat(receitaInput.replace(',', '.')) || 0),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumo'] })
      setEditandoReceita(false)
    },
  })

  const receita  = resumo?.receita ?? 0
  const saldo    = resumo?.saldo   ?? 0
  const saldoPos = saldo >= 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="relative group min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-c-muted">Receita do mês</p>
          {editandoReceita ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number" step="0.01" min={0} autoFocus
                value={receitaInput}
                onChange={e => setReceitaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && salvarReceita.mutate()}
                className="w-full text-lg font-bold bg-transparent border-b border-accent-500 outline-none text-c-primary"
              />
              <button onClick={() => salvarReceita.mutate()} className="text-paid flex-shrink-0"><Check size={16} /></button>
              <button onClick={() => setEditandoReceita(false)} className="text-c-muted hover:text-c-primary flex-shrink-0"><X size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1 min-w-0">
              <p className="text-lg sm:text-2xl font-bold tabular-nums text-paid truncate">
                {loadingResumo ? '…' : BRL(receita)}
              </p>
              <button
                onClick={() => { setReceitaInput(String(receita)); setEditandoReceita(true) }}
                className="opacity-0 group-hover:opacity-100 text-c-muted hover:text-c-primary transition-opacity flex-shrink-0"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </Card>

        <Card className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-c-muted">Parcelas</p>
          <p className="text-lg sm:text-2xl font-bold tabular-nums text-due mt-1 truncate">
            {loadingResumo ? '…' : BRL(resumo?.totalParcelas ?? 0)}
          </p>
        </Card>
        <Card className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-c-muted">Recorrentes</p>
          <p className="text-lg sm:text-2xl font-bold tabular-nums text-accent-500 mt-1 truncate">
            {loadingResumo ? '…' : BRL(resumo?.totalRecorrentes ?? 0)}
          </p>
        </Card>
        <Card className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-c-muted">Saldo disponível</p>
          <p className={`text-lg sm:text-2xl font-bold tabular-nums mt-1 truncate ${saldoPos ? 'text-paid' : 'text-overdue'}`}>
            {loadingResumo ? '…' : (saldoPos ? '' : '-') + BRL(Math.abs(saldo))}
          </p>
          {!loadingResumo && receita > 0 && (
            <p className="text-xs text-c-muted mt-0.5">
              {(((resumo?.totalGeral ?? 0) / receita) * 100).toFixed(0)}% comprometido
            </p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">
            Projeção — próximos 12 meses
          </h2>
          {loadingProj ? (
            <div className="h-48 flex items-center justify-center text-c-muted">Carregando…</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={projecao} barCategoryGap="30%">
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => BRL(v)} />
                <Bar dataKey="totalParcelas" name="Parcelas" fill="#3D7DFA" radius={[2, 2, 0, 0]} />
                <Bar dataKey="totalRecorrentes" name="Recorrentes" fill="#8B7FD1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">
            Categorias do mês
          </h2>
          {loadingResumo || !resumo?.categorias.length ? (
            <div className="h-48 flex items-center justify-center text-c-muted">
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
    </div>
  )
}

function ConsolidadoPainel() {
  const { isDark } = useTheme()
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

  const { axisColor, tooltipStyle } = chartTheme(isDark)
  const mesLabel = new Date(ano, mes - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  const chartData = (data as ConsolidadoMes | undefined)?.perfis.map(p => ({
    name: p.perfilNome,
    receita: p.receita,
    despesas: p.totalGeral,
    saldo: p.saldo,
  })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navMes(-1)} className="p-1.5 rounded-xl hover:bg-bg-elevated text-c-muted">‹</button>
        <span className="text-sm font-medium uppercase tracking-wide text-c-primary">{mesLabel}</span>
        <button onClick={() => navMes(1)} className="p-1.5 rounded-xl hover:bg-bg-elevated text-c-muted">›</button>
      </div>

      {isLoading ? (
        <p className="text-c-muted">Carregando…</p>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile label="Receita Total" value={BRL(data.totalReceita)} tone="paid" />
            <StatTile label="Despesas Totais" value={BRL(data.totalDespesas)} tone="overdue" />
            <StatTile label="Saldo Consolidado" value={BRL(data.totalSaldo)} tone={data.totalSaldo >= 0 ? 'paid' : 'overdue'} />
          </div>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">Resumo por Perfil</h2>
            {data.perfis.length === 0 ? (
              <p className="text-c-muted text-sm">Nenhum perfil cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {data.perfis.map(p => {
                  const pct = p.receita > 0 ? Math.round((p.totalGeral / p.receita) * 100) : 0
                  const cor = pct >= 100 ? 'bg-overdue' : pct >= 80 ? 'bg-due' : 'bg-paid'
                  return (
                    <div key={p.perfilId} className="p-4 rounded-xl border border-c-border bg-bg-elevated">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-c-primary">{p.perfilNome}</span>
                        <span className={`text-sm font-semibold ${p.saldo >= 0 ? 'text-paid' : 'text-overdue'}`}>
                          {BRL(p.saldo)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-c-muted mb-1.5">
                        <span>Receita: {BRL(p.receita)}</span>
                        <span>Despesas: {BRL(p.totalGeral)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-bg-body overflow-hidden">
                        <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {chartData.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">Comparativo por Perfil</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => BRL(v)} />
                  <Bar dataKey="receita" name="Receita" fill="#3DBF80" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#D9724A" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { activeProfile } = useProfile()
  const [consolidado, setConsolidado] = useState(false)
  const now = new Date()

  const { data: todosPerfis = [] } = useQuery({
    queryKey: ['perfis'],
    queryFn: perfisApi.listar,
  })

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="text-center max-w-sm w-full">
          <p className="text-c-muted">
            Selecione um perfil em <strong className="text-c-primary">Configurações</strong> para começar.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-c-border">
        <div>
          <h1 className="text-xl font-semibold uppercase tracking-wide text-c-primary">Painel Geral</h1>
          <p className="text-sm text-c-muted mt-1 capitalize">
            {now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        {todosPerfis.length > 1 && (
          <button
            onClick={() => setConsolidado(s => !s)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs uppercase tracking-wide font-semibold transition-colors border ${
              consolidado
                ? 'bg-accent-500 text-white border-accent-500'
                : 'bg-bg-card text-c-muted border-c-border hover:border-accent-500 hover:text-accent-500'
            }`}
          >
            <Layers size={14} />
            Consolidado
          </button>
        )}
      </div>

      {consolidado ? <ConsolidadoPainel /> : <ResumoPainel />}
    </div>
  )
}
