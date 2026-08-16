import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orcamentosApi, Orcamento, OrcamentoRequest } from '../../domains/configuracao/api'
import { useProfile } from '../../shared/context/ProfileContext'
import { Card, Button, Input, PageHeader, Badge, MonthNav, ProgressBar, StatTile } from '../../shared/components/ui'
import { Plus, X, Trash2 } from 'lucide-react'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function OrcamentosPage() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<OrcamentoRequest>({ categoria: '', valorLimite: 0 })
  const [erro, setErro] = useState('')

  function navMes(delta: number) {
    const d = new Date(ano, mes - 1 + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth() + 1)
  }

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

  const totalLimite = orcamentos.reduce((s, o) => s + o.valorLimite, 0)
  const totalGasto  = orcamentos.reduce((s, o) => s + o.gastoAtual, 0)

  if (!activeProfile) {
    return <div><Card><p className="text-c-muted">Selecione um perfil primeiro.</p></Card></div>
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orçamentos"
        subtitle="Limites de gasto por categoria"
        actions={<Button onClick={() => { setShowForm(s => !s); setErro('') }}><Plus size={14} className="inline mr-1" />Novo Orçamento</Button>}
      />

      <MonthNav ano={ano} mes={mes} onNavigate={navMes} />

      {orcamentos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatTile label="Orçamento total" value={BRL(totalLimite)} />
          <StatTile label="Gasto até agora" value={BRL(totalGasto)} tone="due" />
          <StatTile
            label="Disponível"
            value={BRL(Math.max(totalLimite - totalGasto, 0))}
            tone={totalLimite - totalGasto < 0 ? 'overdue' : 'paid'}
          />
        </div>
      )}

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-c-primary">Novo Orçamento</h2>
            <button onClick={() => setShowForm(false)} className="text-c-muted hover:text-c-primary"><X size={18} /></button>
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
          {erro && <p className="text-xs text-overdue mt-2">{erro}</p>}
          <div className="flex justify-end mt-4">
            <Button onClick={() => criar.mutate()} disabled={!form.categoria.trim() || !form.valorLimite || criar.isPending}>
              Salvar
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-c-muted">Carregando…</p>
      ) : orcamentos.length === 0 ? (
        <Card>
          <p className="text-c-muted text-sm">
            Nenhum orçamento definido. Crie limites por categoria para acompanhar seus gastos.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orcamentos.map((o: Orcamento) => {
            const pct = o.percentual
            const tone = pct >= 100 ? 'overdue' : pct >= 80 ? 'due' : 'paid'
            const badgeColor = pct >= 100 ? 'rose' : pct >= 80 ? 'amber' : 'accent'
            return (
              <Card key={o.id}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <p className="font-semibold text-c-primary truncate">{o.categoria}</p>
                    <Badge color={badgeColor as any}>{pct.toFixed(0)}%</Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-bold tabular-nums ${tone === 'overdue' ? 'text-overdue' : tone === 'due' ? 'text-due' : 'text-paid'}`}>{BRL(o.gastoAtual)}</p>
                      <p className="text-xs text-c-muted">de {BRL(o.valorLimite)}</p>
                    </div>
                    <button
                      onClick={() => deletar.mutate(o.id)}
                      disabled={deletar.isPending}
                      className="text-c-muted hover:text-overdue transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <ProgressBar pct={pct} tone={tone} />
                {pct >= 100 && (
                  <p className="text-xs text-overdue mt-1.5">
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
