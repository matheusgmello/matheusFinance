import { useState } from 'react'
import { relatoriosApi } from '../../domains/dashboard/api/extra'
import { Card, Button, PageHeader } from '../../shared/components/ui'
import { Download, FileText } from 'lucide-react'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const SELECT_CLS = 'bg-bg-elevated border border-c-border rounded-xl px-3 py-2 text-sm text-c-primary focus:outline-none focus:ring-1 focus:ring-accent-500'

export default function RelatoriosPage() {
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
      <PageHeader title="Relatórios" subtitle="Exporte seus dados em CSV" />

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-accent-500/10 border border-accent-500/30 flex items-center justify-center text-accent-500">
            <FileText size={16} />
          </div>
          <div>
            <p className="font-semibold text-c-primary">Compras parceladas por ano</p>
            <p className="text-xs text-c-muted">Todas as parcelas vencidas no ano — útil para declaração de IR</p>
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
            <Download size={14} className="inline mr-1.5" />
            {baixando === 'compras' ? 'Gerando…' : 'Baixar CSV'}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-accent-500/10 border border-accent-500/30 flex items-center justify-center text-accent-500">
            <FileText size={16} />
          </div>
          <div>
            <p className="font-semibold text-c-primary">Gastos do mês</p>
            <p className="text-xs text-c-muted">Parcelas + recorrentes de um mês específico</p>
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
            <Download size={14} className="inline mr-1.5" />
            {baixando === 'gastos' ? 'Gerando…' : 'Baixar CSV'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
