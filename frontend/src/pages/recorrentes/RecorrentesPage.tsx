import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recorrentesApi, RecorrenteRequest, ChecklistItem } from '../../api/recorrentes'
import { useProfile } from '../../context/ProfileContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Plus, X, Trash2, CheckCircle, Circle } from 'lucide-react'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

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
        <h2 className="font-semibold text-slate-100">Novo Pagamento Recorrente</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="Empresa" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} placeholder="Ex: Netflix" />
        <Input label="Valor (R$)" type="number" step="0.01" min={0.01} value={form.valor}
          onChange={e => setForm(f => ({ ...f, valor: Number(e.target.value) }))} />
        <Input label="Dia Vencimento" type="number" min={1} max={31} value={form.diaVencimento}
          onChange={e => setForm(f => ({ ...f, diaVencimento: Number(e.target.value) }))} />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={() => criar.mutate()} disabled={!form.empresa.trim() || !form.valor || criar.isPending}>
          Salvar
        </Button>
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
    return <div className="p-6"><Card><p className="text-slate-400">Selecione um perfil primeiro.</p></Card></div>
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Pagamentos Recorrentes"
        subtitle="Contas fixas mensais"
        actions={<Button onClick={() => setShowForm(s => !s)}><Plus size={16} className="inline mr-1" />Novo</Button>}
      />

      {showForm && <RecorrenteForm onClose={() => setShowForm(false)} />}

      {/* Month selector */}
      <Card className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Mês:</label>
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            className="bg-slate-900 border border-slate-600 rounded-xl px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
            className="bg-slate-900 border border-slate-600 rounded-xl px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y =>
              <option key={y} value={y}>{y}</option>
            )}
          </select>
        </div>
        <div className="ml-auto text-sm text-slate-400">
          Pago: <span className="text-accent-400 font-semibold">{BRL(totalPago)}</span>
          {' '}/ Total: <span className="text-slate-200 font-semibold">{BRL(totalMes)}</span>
        </div>
      </Card>

      {/* Checklist */}
      {isLoading ? (
        <p className="text-slate-400">Carregando…</p>
      ) : checklist.length === 0 ? (
        <Card><p className="text-slate-500">Nenhum pagamento recorrente ativo.</p></Card>
      ) : (
        <div className="space-y-2">
          {checklist.map((item: ChecklistItem) => (
            <Card key={item.recorrenteId} className="flex items-center gap-4 p-4">
              <button
                onClick={() => marcar.mutate({ id: item.recorrenteId, pago: !item.pago })}
                className={`flex-shrink-0 transition ${item.pago ? 'text-accent-400' : 'text-slate-600 hover:text-accent-500'}`}
              >
                {item.pago ? <CheckCircle size={22} /> : <Circle size={22} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${item.pago ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                  {item.empresa}
                </p>
                <p className="text-xs text-slate-500">Vence dia {item.diaVencimento}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${item.pago ? 'text-slate-500' : 'text-slate-100'}`}>
                  {BRL(item.valor)}
                </span>
                <Badge color={item.pago ? 'accent' : 'slate'}>{item.pago ? 'Pago' : 'Pendente'}</Badge>
                <button
                  onClick={() => inativar.mutate(item.recorrenteId)}
                  className="text-slate-600 hover:text-rose-400 transition"
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
