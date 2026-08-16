import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { faturaApi, FaturaCartao } from '../../domains/dashboard/api/extra'
import { useProfile } from '../../shared/context/ProfileContext'
import { Card, Badge, PageHeader, MonthNav, ProgressBar, StatTile, Lamp } from '../../shared/components/ui'
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function FaturaCartaoBoard({ cartao }: { cartao: FaturaCartao }) {
  const [expanded, setExpanded] = useState(true)
  const pendente = cartao.total - cartao.totalPago
  const pctPago = cartao.total > 0 ? (cartao.totalPago / cartao.total) * 100 : 0

  return (
    <Card>
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-500/10 border border-accent-500/30 flex items-center justify-center text-accent-500 flex-shrink-0">
            <CreditCard size={18} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-c-primary">{cartao.cartaoNome}</p>
            <p className="text-xs text-c-muted">Vence dia {cartao.diaVencimento}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold tabular-nums text-c-primary">{BRL(cartao.total)}</p>
            <p className="text-xs text-c-muted">
              {cartao.totalPago > 0 ? <span className="text-paid">{BRL(cartao.totalPago)} pago</span> : 'Nenhum pago'}
            </p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-c-muted" /> : <ChevronDown size={16} className="text-c-muted" />}
        </div>
      </button>

      <div className="mt-3">
        <ProgressBar pct={pctPago} tone="paid" />
      </div>

      {expanded && (
        <div className="mt-4 border-t border-c-border pt-4 space-y-2">
          {cartao.itens.map(item => (
            <div key={item.parcelaId} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Lamp state={item.paga ? 'paid' : 'neutral'} size={15} />
                <span className={`truncate ${item.paga ? 'line-through text-c-muted' : 'text-c-primary'}`}>
                  {item.descricao}
                </span>
                {item.categoria && <Badge color="slate">{item.categoria}</Badge>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-c-muted whitespace-nowrap">
                  {item.numeroParcela}/{item.totalParcelas}
                </span>
                <span className={`font-semibold tabular-nums whitespace-nowrap ${item.paga ? 'text-c-muted' : 'text-c-primary'}`}>
                  {BRL(item.valor)}
                </span>
              </div>
            </div>
          ))}

          <div className="pt-2 mt-2 border-t border-c-border flex justify-between text-sm font-semibold">
            <span className="text-c-muted">Pendente</span>
            <span className="text-overdue">{BRL(pendente)}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function FaturaPage() {
  const { activeProfile } = useProfile()
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)

  function navMes(delta: number) {
    const d = new Date(ano, mes - 1 + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth() + 1)
  }

  const { data: fatura, isLoading } = useQuery({
    queryKey: ['fatura', activeProfile?.id, ano, mes],
    queryFn: () => faturaApi.get(ano, mes),
    enabled: !!activeProfile,
  })

  const mesLabel = new Date(ano, mes - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  const pendente = fatura ? fatura.totalGeral - fatura.totalPago : 0

  if (!activeProfile) {
    return <div><Card><p className="text-c-muted">Selecione um perfil primeiro.</p></Card></div>
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Fatura do Mês" subtitle="Parcelas e recorrentes que vencem no mês" />

      <MonthNav ano={ano} mes={mes} onNavigate={navMes} />

      {fatura && fatura.totalGeral > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatTile label="Total fatura" value={BRL(fatura.totalGeral)} />
          <StatTile label="Pago" value={BRL(fatura.totalPago)} tone="paid" />
          <StatTile label="Pendente" value={BRL(pendente)} tone="overdue" />
        </div>
      )}

      {isLoading ? (
        <p className="text-c-muted">Carregando…</p>
      ) : !fatura || fatura.cartoes.length === 0 ? (
        <Card>
          <p className="text-c-muted text-center py-4">
            Nenhuma parcela vence em {mesLabel}.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {fatura.cartoes.map(cartao => (
            <FaturaCartaoBoard key={cartao.cartaoId} cartao={cartao} />
          ))}
        </div>
      )}
    </div>
  )
}
