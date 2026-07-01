import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card } from '../../components/ui/Card'
import { useTheme } from '../../context/ThemeContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Campo({
  label, value, onChange, min = 0, step = 1, placeholder = '0',
}: {
  label: string; value: number | ''; onChange: (v: number) => void
  min?: number; step?: number; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 dark:text-slate-400">{label}</label>
      <input
        type="number" min={min} step={step} placeholder={placeholder}
        value={value === 0 ? '' : value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
      />
    </div>
  )
}

// ─── 4.1 Juros Compostos ──────────────────────────────────────────────────────

function JurosTab() {
  const { theme } = useTheme()
  const [capital, setCapital]   = useState(10000)
  const [aporte,  setAporte]    = useState(500)
  const [taxa,    setTaxa]      = useState(12)
  const [anos,    setAnos]      = useState(10)

  const { tabela, total, totalAportado, rendimento } = useMemo(() => {
    const r = taxa / 100 / 12  // taxa mensal
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
    return {
      tabela,
      total: saldo,
      totalAportado,
      rendimento: saldo - totalAportado,
    }
  }, [capital, aporte, taxa, anos])

  const axisColor = theme === 'dark' ? '#94a3b8' : '#6b7280'
  const tooltipStyle = theme === 'dark'
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12 }
    : { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }
  const tooltipLabelStyle = theme === 'dark' ? { color: '#f1f5f9' } : { color: '#111827' }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Parâmetros</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Campo label="Capital inicial (R$)" value={capital} onChange={setCapital} step={100} />
          <Campo label="Aporte mensal (R$)" value={aporte} onChange={setAporte} step={100} />
          <Campo label="Taxa de retorno (% a.a.)" value={taxa} onChange={setTaxa} step={0.1} placeholder="12" />
          <Campo label="Período (anos)" value={anos} onChange={setAnos} min={1} />
        </div>
      </Card>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Patrimônio Final', value: total, color: 'text-accent-600 dark:text-accent-400' },
          { label: 'Total Aportado', value: totalAportado, color: 'text-gray-700 dark:text-slate-200' },
          { label: 'Rendimento', value: rendimento, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{BRL(value)}</p>
          </Card>
        ))}
      </div>

      {/* Gráfico */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Evolução patrimonial</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={tabela} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPatr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAport" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#f3f4f6'} />
            <XAxis dataKey="ano" tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false} tickLine={false} tickFormatter={v => `Ano ${v}`} />
            <YAxis tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={48} />
            <Tooltip
              contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
              formatter={(v: unknown, name: string) => [BRL(Number(v)), name === 'patrimonio' ? 'Patrimônio' : 'Aportado']}
              labelFormatter={v => `Ano ${v}`}
            />
            <Area type="monotone" dataKey="aportado" stroke="#6366f1" fill="url(#gradAport)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="patrimonio" stroke="#10b981" fill="url(#gradPatr)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabela */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">Evolução ano a ano</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700 text-left">
                <th className="pb-2 font-medium">Ano</th>
                <th className="pb-2 font-medium text-right">Total Aportado</th>
                <th className="pb-2 font-medium text-right">Patrimônio</th>
                <th className="pb-2 font-medium text-right">Rendimento</th>
                <th className="pb-2 font-medium text-right">Mult.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {tabela.map(row => {
                const rend = row.patrimonio - row.aportado
                const mult = row.patrimonio / row.aportado
                return (
                  <tr key={row.ano} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="py-2 text-gray-700 dark:text-slate-300 font-medium">{row.ano}º ano</td>
                    <td className="py-2 text-right text-gray-500 dark:text-slate-400">{BRL(row.aportado)}</td>
                    <td className="py-2 text-right font-semibold text-gray-900 dark:text-slate-100">{BRL(row.patrimonio)}</td>
                    <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{BRL(rend)}</td>
                    <td className="py-2 text-right text-gray-500 dark:text-slate-400">{mult.toFixed(2)}x</td>
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

// ─── 4.2 Preço Médio ─────────────────────────────────────────────────────────

function PrecoMedioTab() {
  const [qtdAtual,    setQtdAtual]    = useState(100)
  const [precoAtual,  setPrecoAtual]  = useState(30)
  const [qtdNova,     setQtdNova]     = useState(50)
  const [precoNovo,   setPrecoNovo]   = useState(25)

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
        {/* Posição atual */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Posição atual</h3>
          <div className="space-y-3">
            <Campo label="Quantidade atual" value={qtdAtual} onChange={setQtdAtual} />
            <Campo label="Preço médio atual (R$)" value={precoAtual} onChange={setPrecoAtual} step={0.01} />
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-400 dark:text-slate-500">Custo total atual</p>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{BRL(result.custoAtual)}</p>
            </div>
          </div>
        </Card>

        {/* Novo aporte */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Novo aporte</h3>
          <div className="space-y-3">
            <Campo label="Quantidade a comprar" value={qtdNova} onChange={setQtdNova} />
            <Campo label="Preço de compra (R$)" value={precoNovo} onChange={setPrecoNovo} step={0.01} />
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-400 dark:text-slate-500">Custo do novo aporte</p>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{BRL(result.custoNovo)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Resultado */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Resultado após aporte</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Quantidade Total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{result.totalQtd}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Custo Total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{BRL(result.totalCusto)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Novo Preço Médio</p>
            <p className="text-xl font-bold text-accent-600 dark:text-accent-400">{BRL(result.novoMedio)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Variação do P.M.</p>
            <p className={`text-xl font-bold ${down ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {result.varPercent >= 0 ? '+' : ''}{result.varPercent.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {down ? 'Aporte abaixo do PM atual — boa estratégia de baixa' : 'Aporte acima do PM atual — eleva o custo médio'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── 4.3 Projeção de Objetivo ────────────────────────────────────────────────

function ProjecaoTab() {
  const { theme } = useTheme()
  const [patrimonioAtual, setPatrimonioAtual] = useState(50000)
  const [aportesMensal,   setAportesMensal]   = useState(1000)
  const [taxa,            setTaxa]            = useState(12)
  const [objetivo,        setObjetivo]        = useState(500000)

  const { meses, anos, trajetoria } = useMemo(() => {
    const r = taxa / 100 / 12
    let saldo = patrimonioAtual
    let m = 0
    const trajetoria: { mes: number; patrimonio: number }[] = [{ mes: 0, patrimonio: saldo }]

    // Max 600 meses (50 anos) para evitar loop infinito
    while (saldo < objetivo && m < 600) {
      saldo = saldo * (1 + r) + aportesMensal
      m++
      if (m % 12 === 0 || saldo >= objetivo) {
        trajetoria.push({ mes: m, patrimonio: Math.min(saldo, objetivo * 1.1) })
      }
    }

    return {
      meses: m,
      anos: Math.floor(m / 12),
      trajetoria,
    }
  }, [patrimonioAtual, aportesMensal, taxa, objetivo])

  const atingido = meses < 600
  const axisColor = theme === 'dark' ? '#94a3b8' : '#6b7280'
  const tooltipStyle = theme === 'dark'
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12 }
    : { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }
  const tooltipLabelStyle = theme === 'dark' ? { color: '#f1f5f9' } : { color: '#111827' }

  const mesesRestantes = meses % 12

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Parâmetros</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Campo label="Patrimônio atual (R$)" value={patrimonioAtual} onChange={setPatrimonioAtual} step={1000} />
          <Campo label="Aporte mensal (R$)"    value={aportesMensal}   onChange={setAportesMensal}   step={100} />
          <Campo label="Taxa de retorno (% a.a.)" value={taxa}         onChange={setTaxa}             step={0.1} />
          <Campo label="Objetivo (R$)"          value={objetivo}        onChange={setObjetivo}         step={10000} />
        </div>
      </Card>

      {/* Resultado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Objetivo</p>
          <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">{BRL(objetivo)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Prazo estimado</p>
          {atingido ? (
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {anos > 0 ? `${anos} ano${anos !== 1 ? 's' : ''}` : ''}{mesesRestantes > 0 ? ` ${mesesRestantes} mês${mesesRestantes !== 1 ? 'es' : ''}` : ''}
            </p>
          ) : (
            <p className="text-lg font-bold text-amber-500">+50 anos</p>
          )}
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{meses} meses no total</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Total a aportar</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {BRL(aportesMensal * meses)}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            Rendimento: {BRL(objetivo - patrimonioAtual - aportesMensal * meses)}
          </p>
        </Card>
      </div>

      {/* Gráfico trajetória */}
      {atingido && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Trajetória até o objetivo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trajetoria} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradObj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#f3f4f6'} />
              <XAxis dataKey="mes" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${Math.floor(Number(v) / 12)}a`} />
              <YAxis tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={52} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
                formatter={(v: unknown) => [BRL(Number(v)), 'Patrimônio']}
                labelFormatter={v => `Mês ${v} (Ano ${Math.floor(Number(v) / 12)})`}
              />
              <Area type="monotone" dataKey="patrimonio" stroke="#10b981" fill="url(#gradObj)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {!atingido && (
        <Card>
          <div className="text-center py-8 text-amber-600 dark:text-amber-400">
            <p className="text-lg font-semibold">Com esses parâmetros, o objetivo leva mais de 50 anos.</p>
            <p className="text-sm mt-1 text-gray-400 dark:text-slate-500">Tente aumentar o aporte mensal ou a taxa de retorno.</p>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'Juros Compostos' | 'Preço Médio' | 'Projeção'
const TABS: Tab[] = ['Juros Compostos', 'Preço Médio', 'Projeção']

export default function CalculadorasPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Juros Compostos')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Calculadoras</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Simule cenários de investimento sem sair do app</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
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
