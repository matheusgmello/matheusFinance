import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartoesApi, Cartao, CartaoRequest } from '../../domains/cartao/api'
import { useProfile } from '../../shared/context/ProfileContext'
import { Card, Button, Input, PageHeader } from '../../shared/components/ui'
import { CreditCard, Trash2, Plus, X, Pencil } from 'lucide-react'

function CartaoForm({ onClose, editando }: { onClose: () => void; editando?: Cartao }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<CartaoRequest>(
    editando
      ? { nome: editando.nome, diaVencimento: editando.diaVencimento, diaFechamento: editando.diaFechamento }
      : { nome: '', diaVencimento: 10, diaFechamento: 3 }
  )
  const [erro, setErro] = useState('')
  const salvar = useMutation({
    mutationFn: () => editando
      ? cartoesApi.atualizar(editando.id, form)
      : cartoesApi.criar(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cartoes'] }); onClose() },
    onError: (e: any) => setErro(e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Erro ao salvar cartão.'),
  })
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-c-primary">{editando ? 'Editar Cartão' : 'Novo Cartão'}</h2>
        <button onClick={onClose} className="text-c-muted hover:text-c-primary"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="Nome" value={form.nome} onChange={e => { setForm(f => ({ ...f, nome: e.target.value })); setErro('') }} placeholder="Ex: Nubank" />
        <Input label="Dia Vencimento" type="number" min={1} max={31} value={form.diaVencimento}
          onChange={e => setForm(f => ({ ...f, diaVencimento: Number(e.target.value) }))} />
        <Input label="Dia Fechamento" type="number" min={1} max={31} value={form.diaFechamento}
          onChange={e => setForm(f => ({ ...f, diaFechamento: Number(e.target.value) }))} />
      </div>
      {erro && <p className="text-xs text-overdue mt-3">{erro}</p>}
      <div className="flex justify-end mt-4">
        <Button onClick={() => salvar.mutate()} disabled={!form.nome.trim() || salvar.isPending}>
          {salvar.isPending ? 'Salvando…' : editando ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </Card>
  )
}

export default function CartoesPage() {
  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Cartao | null>(null)

  const { data: cartoes = [], isLoading } = useQuery({
    queryKey: ['cartoes', activeProfile?.id],
    queryFn: cartoesApi.listar,
    enabled: !!activeProfile,
  })
  const deletar = useMutation({
    mutationFn: (id: number) => cartoesApi.deletar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cartoes'] }),
  })

  function abrirEdicao(c: Cartao) {
    setShowForm(false)
    setEditando(c)
  }
  function fecharForm() {
    setShowForm(false)
    setEditando(null)
  }

  if (!activeProfile) {
    return <div><Card><p className="text-c-muted">Selecione um perfil primeiro.</p></Card></div>
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cartões"
        subtitle="Gerencie seus cartões de crédito"
        actions={<Button onClick={() => { setShowForm(s => !s); setEditando(null) }}><Plus size={14} className="inline mr-1" />Novo Cartão</Button>}
      />

      {showForm && <CartaoForm onClose={fecharForm} />}
      {editando && <CartaoForm onClose={fecharForm} editando={editando} />}

      {isLoading ? (
        <p className="text-c-muted">Carregando…</p>
      ) : cartoes.length === 0 ? (
        <Card><p className="text-c-muted">Nenhum cartão cadastrado.</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cartoes.map((c: Cartao) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-500/10 border border-accent-500/30 flex items-center justify-center text-accent-500">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-c-primary">{c.nome}</p>
                    <p className="text-xs text-c-muted mt-0.5">Venc. dia {c.diaVencimento} · Fecha dia {c.diaFechamento}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => abrirEdicao(c)} className="p-1.5 text-c-muted hover:text-accent-500 transition rounded-full hover:bg-accent-500/10">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deletar.mutate(c.id)} className="p-1.5 text-c-muted hover:text-overdue transition rounded-full hover:bg-overdue/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
