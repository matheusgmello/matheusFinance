import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recorrentesApi, RecorrenteRequest, ChecklistItem } from '../../domains/recorrente/api'
import { useProfile } from '../../shared/context/ProfileContext'
import { Card, Button, Input, PageHeader, Badge, CategoriaSelect, MonthNav, Lamp } from '../../shared/components/ui'
import { Plus, X, Trash2 } from 'lucide-react'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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
        <h2 className="font-semibold text-c-primary">Novo Pagamento Recorrente</h2>
        <button onClick={onClose} className="text-c-muted hover:text-c-primary"><X size={18} /></button>
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

export default function RecorrentesPage() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [showForm, setShowForm] = useState(false)

  function navMes(delta: number) {
    const d = new Date(ano, mes - 1 + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth() + 1)
  }

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

  if (!activeProfile) {
    return <div><Card><p className="text-c-muted">Selecione um perfil primeiro.</p></Card></div>
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pagamentos Recorrentes"
        subtitle="Contas fixas mensais"
        actions={<Button onClick={() => setShowForm(s => !s)}><Plus size={14} className="inline mr-1" />Novo</Button>}
      />

      {showForm && <RecorrenteForm onClose={() => setShowForm(false)} />}

      <Card padding="tight">
        <MonthNav ano={ano} mes={mes} onNavigate={navMes} />
        <div className="mt-3 pt-3 border-t border-c-border text-sm text-c-muted">
          Pago: <span className="text-paid font-semibold">{BRL(totalPago)}</span>
          {' '}/ Total: <span className="text-c-primary font-semibold">{BRL(totalMes)}</span>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-c-muted">Carregando…</p>
      ) : checklist.length === 0 ? (
        <Card><p className="text-c-muted">Nenhum pagamento recorrente ativo.</p></Card>
      ) : (
        <div className="space-y-1">
          {checklist.map((item: ChecklistItem) => (
            <Card key={item.recorrenteId} padding="tight" className="flex items-center gap-4">
              <button
                onClick={() => marcar.mutate({ id: item.recorrenteId, pago: !item.pago })}
                className="flex-shrink-0"
              >
                <Lamp state={item.pago ? 'paid' : 'neutral'} size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${item.pago ? 'line-through text-c-muted' : 'text-c-primary'}`}>
                  {item.empresa}
                </p>
                <p className="text-xs text-c-muted">Vence dia {item.diaVencimento}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold tabular-nums ${item.pago ? 'text-c-muted' : 'text-c-primary'}`}>
                  {BRL(item.valor)}
                </span>
                <Badge color={item.pago ? 'accent' : 'slate'}>{item.pago ? 'Pago' : 'Pendente'}</Badge>
                <button
                  onClick={() => inativar.mutate(item.recorrenteId)}
                  className="text-c-muted hover:text-overdue transition"
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
