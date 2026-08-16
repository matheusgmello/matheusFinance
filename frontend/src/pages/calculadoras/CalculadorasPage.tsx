import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, PageHeader } from '../../shared/components/ui'
import { useTheme } from '../../shared/context/ThemeContext'

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function chartTheme(isDark: boolean) {
  return {
    axisColor: isDark ? '#94989E' : '#5B5F66',
    gridColor: isDark ? '#242428' : '#ECEDEF',
    tooltipStyle: {
      backgroundColor: isDark ? '#1B1B1E' : '#F7F7F8',
      border: `1px solid ${isDark ? '#2D2D32' : '#C7C9CD'}`,
      borderRadius: 6,
      
      fontSize: 12,
    },
    tooltipLabelStyle: { color: isDark ? '#F2F2F2' : '#17181A' },
  }
}

function Campo({
  label, value, onChange, min = 0, step = 1, placeholder = '0',
}: {
  label: string; value: number | ''; onChange: (v: number) => void
  min?: number; step?: number; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-c-muted">{label}</label>
      <input
        type="number" min={min} step={step} placeholder={placeholder}
        value={value === 0 ? '' : value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="bg-bg-elevated border border-c-border rounded-xl px-3 py-2 text-sm text-c-primary tabular-nums focus:outline-none focus:ring-1 focus:ring-accent-500"
      />
    </div>
  )
}

// ─── Juros Compostos ────────────────────────────────────────────────────────

function JurosTab() {
  const { isDark } = useTheme()
  const [capital, setCapital] = useState(10000)
  const [aporte,  setAporte]  = useState(500)
  const [taxa,    setTaxa]    = useState(12)
  const [anos,    setAnos]    = useState(10)

  const { tabela, total, totalAportado, rendimento } = useMemo(() => {
    const r = taxa / 100 / 12
    const meses = anos * 12
    const tabela: { ano: number; patrimonio: number; aportado: number }[] = []
    let saldo = capital

    for (let m = 1; m <= meses; m++) {
      saldo = saldo * (1 + r) + aporte
      if (m % 12 === 0) {
        const a = m / 12
        const totalAportadoAte = capital + aporte * m
        tabela.push({ ano: a, patrimonio: saldo, aportado: totalAportadoAte })
      }
    }

    const totalAportado = capital + aporte * meses
    return { tabela, total: saldo, totalAportado, rendimento: saldo - totalAportado }
  }, [capital, aporte, taxa, anos])

  const { axisColor, gridColor, tooltipStyle, tooltipLabelStyle } = chartTheme(isDark)

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">Parâmetros</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Campo label="Capital inicial (R$)" value={capital} onChange={setCapital} step={100} />
          <Campo label="Aporte mensal (R$)" value={aporte} onChange={setAporte} step={100} />
          <Campo label="Taxa de retorno (% a.a.)" value={taxa} onChange={setTaxa} step={0.1} placeholder="12" />
          <Campo label="Período (anos)" value={anos} onChange={setAnos} min={1} />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Patrimônio Final', value: total, tone: 'text-paid' },
          { label: 'Total Aportado', value: totalAportado, tone: 'text-c-primary' },
          { label: 'Rendimento', value: rendimento, tone: 'text-accent-500' },
        ].map(({ label, value, tone }) => (
          <Card key={label} padding="tight" className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-c-muted mb-1">{label}</p>
            <p className={`text-sm sm:text-xl font-bold tabular-nums truncate ${tone}`}>{BRL(value)}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">Evolução patrimonial</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={tabela} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPatr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3DBF80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3DBF80" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAport" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B7FD1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B7FD1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="ano" tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false} tickLine={false} tickFormatter={v => `Ano ${v}`} />
            <YAxis tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={48} />
            <Tooltip
              contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
              formatter={(v: unknown, name: string) => [BRL(Number(v)), name === 'patrimonio' ? 'Patrimônio' : 'Aportado']}
              labelFormatter={v => `Ano ${v}`}
            />
            <Area type="monotone" dataKey="aportado" stroke="#8B7FD1" fill="url(#gradAport)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="patrimonio" stroke="#3DBF80" fill="url(#gradPatr)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-3">Evolução ano a ano</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-c-muted border-b border-c-border text-left uppercase tracking-wide">
                <th className="pb-2 font-medium">Ano</th>
                <th className="pb-2 font-medium text-right">Total Aportado</th>
                <th className="pb-2 font-medium text-right">Patrimônio</th>
                <th className="pb-2 font-medium text-right">Rendimento</th>
                <th className="pb-2 font-medium text-right">Mult.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-c-border/50">
              {tabela.map(row => {
                const rend = row.patrimonio - row.aportado
                const mult = row.patrimonio / row.aportado
                return (
                  <tr key={row.ano} className="hover:bg-bg-elevated">
                    <td className="py-2 text-c-primary font-medium">{row.ano}º ano</td>
                    <td className="py-2 text-right text-c-muted tabular-nums">{BRL(row.aportado)}</td>
                    <td className="py-2 text-right font-semibold text-c-primary tabular-nums">{BRL(row.patrimonio)}</td>
                    <td className="py-2 text-right text-accent-500 font-semibold tabular-nums">{BRL(rend)}</td>
                    <td className="py-2 text-right text-c-muted tabular-nums">{mult.toFixed(2)}x</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Preço Médio ─────────────────────────────────────────────────────────

function PrecoMedioTab() {
  const [qtdAtual,   setQtdAtual]   = useState(100)
  const [precoAtual, setPrecoAtual] = useState(30)
  const [qtdNova,    setQtdNova]    = useState(50)
  const [precoNovo,  setPrecoNovo]  = useState(25)

  const result = useMemo(() => {
    const custoAtual = qtdAtual * precoAtual
    const custoNovo  = qtdNova  * precoNovo
    const totalQtd   = qtdAtual + qtdNova
    const totalCusto = custoAtual + custoNovo
    const novoMedio  = totalQtd > 0 ? totalCusto / totalQtd : 0
    const varPercent = precoAtual > 0 ? ((novoMedio - precoAtual) / precoAtual) * 100 : 0
    return { custoAtual, custoNovo, totalQtd, totalCusto, novoMedio, varPercent }
  }, [qtdAtual, precoAtual, qtdNova, precoNovo])

  const down = result.varPercent < 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">Posição atual</h3>
          <div className="space-y-3">
            <Campo label="Quantidade atual" value={qtdAtual} onChange={setQtdAtual} />
            <Campo label="Preço médio atual (R$)" value={precoAtual} onChange={setPrecoAtual} step={0.01} />
            <div className="pt-2 border-t border-c-border">
              <p className="text-xs text-c-muted uppercase tracking-wide">Custo total atual</p>
              <p className="text-lg font-bold tabular-nums text-c-primary">{BRL(result.custoAtual)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">Novo aporte</h3>
          <div className="space-y-3">
            <Campo label="Quantidade a comprar" value={qtdNova} onChange={setQtdNova} />
            <Campo label="Preço de compra (R$)" value={precoNovo} onChange={setPrecoNovo} step={0.01} />
            <div className="pt-2 border-t border-c-border">
              <p className="text-xs text-c-muted uppercase tracking-wide">Custo do novo aporte</p>
              <p className="text-lg font-bold tabular-nums text-c-primary">{BRL(result.custoNovo)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">Resultado após aporte</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="min-w-0">
            <p className="text-xs text-c-muted uppercase tracking-wide mb-1">Quantidade Total</p>
            <p className="text-base sm:text-xl font-bold text-c-primary truncate">{result.totalQtd}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-c-muted uppercase tracking-wide mb-1">Custo Total</p>
            <p className="text-base sm:text-xl font-bold tabular-nums text-c-primary truncate">{BRL(result.totalCusto)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-c-muted uppercase tracking-wide mb-1">Novo Preço Médio</p>
            <p className="text-base sm:text-xl font-bold tabular-nums text-accent-500 truncate">{BRL(result.novoMedio)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-c-muted uppercase tracking-wide mb-1">Variação do P.M.</p>
            <p className={`text-base sm:text-xl font-bold truncate ${down ? 'text-paid' : 'text-overdue'}`}>
              {result.varPercent >= 0 ? '+' : ''}{result.varPercent.toFixed(2)}%
            </p>
            <p className="text-xs text-c-muted mt-0.5">
              {down ? 'Aporte abaixo do PM atual — boa estratégia de baixa' : 'Aporte acima do PM atual — eleva o custo médio'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Projeção de Objetivo ────────────────────────────────────────────────

function ProjecaoTab() {
  const { isDark } = useTheme()
  const [patrimonioAtual, setPatrimonioAtual] = useState(50000)
  const [aportesMensal,   setAportesMensal]   = useState(1000)
  const [taxa,             setTaxa]           = useState(12)
  const [objetivo,         setObjetivo]       = useState(500000)

  const { meses, anos, trajetoria } = useMemo(() => {
    const r = taxa / 100 / 12
    let saldo = patrimonioAtual
    let m = 0
    const trajetoria: { mes: number; patrimonio: number }[] = [{ mes: 0, patrimonio: saldo }]

    while (saldo < objetivo && m < 600) {
      saldo = saldo * (1 + r) + aportesMensal
      m++
      if (m % 12 === 0 || saldo >= objetivo) {
        trajetoria.push({ mes: m, patrimonio: Math.min(saldo, objetivo * 1.1) })
      }
    }

    return { meses: m, anos: Math.floor(m / 12), trajetoria }
  }, [patrimonioAtual, aportesMensal, taxa, objetivo])

  const atingido = meses < 600
  const { axisColor, gridColor, tooltipStyle, tooltipLabelStyle } = chartTheme(isDark)
  const mesesRestantes = meses % 12

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">Parâmetros</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Campo label="Patrimônio atual (R$)" value={patrimonioAtual} onChange={setPatrimonioAtual} step={1000} />
          <Campo label="Aporte mensal (R$)"    value={aportesMensal}   onChange={setAportesMensal}   step={100} />
          <Campo label="Taxa de retorno (% a.a.)" value={taxa}         onChange={setTaxa}             step={0.1} />
          <Campo label="Objetivo (R$)"          value={objetivo}        onChange={setObjetivo}         step={10000} />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="tight">
          <p className="text-xs text-c-muted uppercase tracking-wide mb-1">Objetivo</p>
          <p className="text-2xl font-bold tabular-nums text-accent-500">{BRL(objetivo)}</p>
        </Card>
        <Card padding="tight">
          <p className="text-xs text-c-muted uppercase tracking-wide mb-1">Prazo estimado</p>
          {atingido ? (
            <p className="text-2xl font-bold text-c-primary">
              {anos > 0 ? `${anos} ano${anos !== 1 ? 's' : ''}` : ''}{mesesRestantes > 0 ? ` ${mesesRestantes} mês${mesesRestantes !== 1 ? 'es' : ''}` : ''}
            </p>
          ) : (
            <p className="text-lg font-bold text-due">+50 anos</p>
          )}
          <p className="text-xs text-c-muted mt-0.5">{meses} meses no total</p>
        </Card>
        <Card padding="tight">
          <p className="text-xs text-c-muted uppercase tracking-wide mb-1">Total a aportar</p>
          <p className="text-2xl font-bold tabular-nums text-c-primary">
            {BRL(aportesMensal * meses)}
          </p>
          <p className="text-xs text-c-muted mt-0.5">
            Rendimento: {BRL(objetivo - patrimonioAtual - aportesMensal * meses)}
          </p>
        </Card>
      </div>

      {atingido && (
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-c-primary mb-4">Trajetória até o objetivo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trajetoria} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradObj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3D7DFA" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3D7DFA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="mes" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${Math.floor(Number(v) / 12)}a`} />
              <YAxis tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={52} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
                formatter={(v: unknown) => [BRL(Number(v)), 'Patrimônio']}
                labelFormatter={v => `Mês ${v} (Ano ${Math.floor(Number(v) / 12)})`}
              />
              <Area type="monotone" dataKey="patrimonio" stroke="#3D7DFA" fill="url(#gradObj)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {!atingido && (
        <Card>
          <div className="text-center py-8 text-due">
            <p className="text-lg font-semibold">Com esses parâmetros, o objetivo leva mais de 50 anos.</p>
            <p className="text-sm mt-1 text-c-muted">Tente aumentar o aporte mensal ou a taxa de retorno.</p>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

type Tab = 'Juros Compostos' | 'Preço Médio' | 'Projeção'
const TABS: Tab[] = ['Juros Compostos', 'Preço Médio', 'Projeção']

export default function CalculadorasPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Juros Compostos')

  return (
    <div className="space-y-6">
      <PageHeader title="Calculadoras" subtitle="Simule cenários de investimento sem sair do app" />

      <div className="flex gap-1 p-1 bg-bg-elevated rounded-xl w-fit border border-c-border">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wide transition-colors ${
              activeTab === tab
                ? 'bg-bg-card text-c-primary'
                : 'text-c-muted hover:text-c-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Juros Compostos' && <JurosTab />}
      {activeTab === 'Preço Médio'     && <PrecoMedioTab />}
      {activeTab === 'Projeção'        && <ProjecaoTab />}
    </div>
  )
}
