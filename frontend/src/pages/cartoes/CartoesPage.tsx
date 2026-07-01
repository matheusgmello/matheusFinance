import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartoesApi, Cartao, CartaoRequest } from '../../api/cartoes'
import { useProfile } from '../../context/ProfileContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { CreditCard, Trash2, Plus, X } from 'lucide-react'

function CartaoForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<CartaoRequest>({ nome: '', diaVencimento: 10, diaFechamento: 3 })

  const criar = useMutation({
    mutationFn: () => cartoesApi.criar(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cartoes'] }); onClose() },
  })

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-100">Novo Cartão</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Nubank" />
        <Input label="Dia Vencimento" type="number" min={1} max={31} value={form.diaVencimento}
          onChange={e => setForm(f => ({ ...f, diaVencimento: Number(e.target.value) }))} />
        <Input label="Dia Fechamento" type="number" min={1} max={31} value={form.diaFechamento}
          onChange={e => setForm(f => ({ ...f, diaFechamento: Number(e.target.value) }))} />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={() => criar.mutate()} disabled={!form.nome.trim() || criar.isPending}>
          Salvar
        </Button>
      </div>
    </Card>
  )
}

export default function CartoesPage() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: cartoes = [], isLoading } = useQuery({
    queryKey: ['cartoes', activeProfile?.id],
    queryFn: cartoesApi.listar,
    enabled: !!activeProfile,
  })

  const deletar = useMutation({
    mutationFn: (id: number) => cartoesApi.deletar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cartoes'] }),
  })

  if (!activeProfile) {
    return <div className="p-6"><Card><p className="text-slate-400">Selecione um perfil primeiro.</p></Card></div>
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Cartões"
        subtitle="Gerencie seus cartões de crédito"
        actions={<Button onClick={() => setShowForm(s => !s)}><Plus size={16} className="inline mr-1" />Novo Cartão</Button>}
      />

      {showForm && <CartaoForm onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-slate-400">Carregando…</p>
      ) : cartoes.length === 0 ? (
        <Card><p className="text-slate-500">Nenhum cartão cadastrado.</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cartoes.map((c: Cartao) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">{c.nome}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Venc. dia {c.diaVencimento} · Fecha dia {c.diaFechamento}</p>
                  </div>
                </div>
                <button
                  onClick={() => deletar.mutate(c.id)}
                  className="text-slate-600 hover:text-rose-400 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
