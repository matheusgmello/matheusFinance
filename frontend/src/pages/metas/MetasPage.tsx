import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { metasApi, Meta, MetaRequest } from '../../domains/meta/api'
import { useProfile } from '../../shared/context/ProfileContext'
import { Card, Button, Input, PageHeader, ProgressBar } from '../../shared/components/ui'
import { Target, Plus, X, Trash2, PlusCircle } from 'lucide-react'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function MetaCard({ meta }: { meta: Meta }) {
  const qc = useQueryClient()
  const [showAporte, setShowAporte] = useState(false)
  const [valorAporte, setValorAporte] = useState('')

  const aportar = useMutation({
    mutationFn: () => metasApi.aportar(meta.id, parseFloat(valorAporte)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metas'] }); setShowAporte(false); setValorAporte('') },
  })
  const deletar = useMutation({
    mutationFn: () => metasApi.deletar(meta.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['metas'] }),
  })

  const concluida = meta.percentual >= 100
  const prazoFmt = meta.prazo ? new Date(meta.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : null
  const previsaoFmt = meta.previsaoConclusao
    ? new Date(meta.previsaoConclusao + 'T00:00:00').toLocaleDateString('pt-BR')
    : null
  const atrasada = meta.prazo && !concluida && new Date(meta.prazo) < new Date()

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
            concluida ? 'bg-paid/10 text-paid border-paid/30' : 'bg-accent-500/10 text-accent-500 border-accent-500/30'
          }`}>
            <Target size={18} />
          </div>
          <div>
            <p className="font-semibold text-c-primary">{meta.nome}</p>
            {prazoFmt && (
              <p className={`text-xs mt-0.5 ${atrasada ? 'text-overdue' : 'text-c-muted'}`}>
                {atrasada ? 'Prazo vencido: ' : 'Prazo: '}{prazoFmt}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => deletar.mutate()} className="text-c-muted hover:text-overdue transition">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-c-muted">{BRL(meta.valorAtual)} de {BRL(meta.valorAlvo)}</span>
          <span className={`font-semibold ${concluida ? 'text-paid' : 'text-accent-500'}`}>
            {meta.percentual.toFixed(0)}%
          </span>
        </div>
        <ProgressBar pct={meta.percentual} tone={concluida ? 'paid' : 'accent'} />
        <div className="flex justify-between text-xs text-c-muted">
          <span>{concluida ? 'Meta concluída!' : `Faltam ${BRL(meta.faltam)}`}</span>
          {previsaoFmt && !concluida && <span>Previsão: {previsaoFmt}</span>}
        </div>
      </div>

      {!concluida && (
        showAporte ? (
          <div className="flex gap-2">
            <Input
              placeholder="Valor do aporte"
              type="number" step="0.01" min="0.01"
              value={valorAporte}
              onChange={e => setValorAporte(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => aportar.mutate()} disabled={!valorAporte || aportar.isPending}>
              OK
            </Button>
            <button onClick={() => setShowAporte(false)} className="text-c-muted hover:text-c-primary">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAporte(true)}
            className="flex items-center gap-1.5 text-sm text-accent-500 hover:underline"
          >
            <PlusCircle size={15} /> Registrar aporte
          </button>
        )
      )}
    </Card>
  )
}

function MetaForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<MetaRequest>({ nome: '', valorAlvo: 0, valorAtual: 0, prazo: '' })
  const criar = useMutation({
    mutationFn: () => metasApi.criar({
      ...form,
      valorAtual: form.valorAtual || 0,
      prazo: form.prazo || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metas'] }); onClose() },
  })
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-c-primary">Nova Meta</h2>
        <button onClick={onClose} className="text-c-muted hover:text-c-primary"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input label="Nome da meta" placeholder="Ex: Viagem para Europa" value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
        </div>
        <Input label="Valor alvo (R$)" type="number" step="0.01" min="0.01" value={form.valorAlvo}
          onChange={e => setForm(f => ({ ...f, valorAlvo: Number(e.target.value) }))} />
        <Input label="Já tenho (R$)" type="number" step="0.01" min="0" value={form.valorAtual}
          onChange={e => setForm(f => ({ ...f, valorAtual: Number(e.target.value) }))} />
        <Input label="Prazo (opcional)" type="date" value={form.prazo ?? ''}
          onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={() => criar.mutate()} disabled={!form.nome.trim() || form.valorAlvo <= 0 || criar.isPending}>
          Criar Meta
        </Button>
      </div>
    </Card>
  )
}

export default function MetasPage() {
  const { activeProfile } = useProfile()
  const [showForm, setShowForm] = useState(false)

  const { data: metas = [], isLoading } = useQuery({
    queryKey: ['metas', activeProfile?.id],
    queryFn: metasApi.listar,
    enabled: !!activeProfile,
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

  const concluidas = metas.filter(m => m.percentual >= 100)
  const emAndamento = metas.filter(m => m.percentual < 100)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas de Economia"
        subtitle={`${emAndamento.length} em andamento · ${concluidas.length} concluída${concluidas.length !== 1 ? 's' : ''}`}
        actions={<Button onClick={() => setShowForm(s => !s)}><Plus size={14} className="inline mr-1" />Nova Meta</Button>}
      />

      {showForm && <MetaForm onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-c-muted">Carregando…</p>
      ) : metas.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Target size={40} className="mx-auto text-c-muted mb-3" />
            <p className="text-c-muted">Nenhuma meta cadastrada.</p>
            <p className="text-sm text-c-muted mt-1">Crie sua primeira meta de economia acima.</p>
          </div>
        </Card>
      ) : (
        <>
          {emAndamento.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {emAndamento.map(m => <MetaCard key={m.id} meta={m} />)}
            </div>
          )}
          {concluidas.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-c-muted uppercase tracking-widest">Concluídas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {concluidas.map(m => <MetaCard key={m.id} meta={m} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
