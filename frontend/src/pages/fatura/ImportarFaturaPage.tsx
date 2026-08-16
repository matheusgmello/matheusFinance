import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { cartoesApi } from '../../domains/cartao/api'
import { faturaApi, ResultadoImportFatura } from '../../domains/compra/api'
import { Card, Button, PageHeader } from '../../shared/components/ui'
import { Upload } from 'lucide-react'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const SELECT_CLS = 'bg-bg-elevated border border-c-border rounded-xl px-4 py-2 text-c-primary focus:outline-none focus:ring-1 focus:ring-accent-500'

export default function ImportarFaturaPage() {
  const hoje = new Date()

  const [cartaoId, setCartaoId] = useState('')
  const [banco, setBanco] = useState('nubank')
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportFatura[] | null>(null)
  const [erro, setErro] = useState('')

  const { data: cartoes = [] } = useQuery({ queryKey: ['cartoes'], queryFn: cartoesApi.listar })

  const importar = useMutation({
    mutationFn: () => faturaApi.importar(Number(cartaoId), ano, mes, banco, arquivo as File),
    onSuccess: (data) => { setResultado(data); setErro('') },
    onError: (e: any) => { setErro(e?.response?.data?.detail ?? 'Falha ao importar fatura.'); setResultado(null) },
  })

  function handleSubmit() {
    setErro('')
    setResultado(null)
    if (!cartaoId) return setErro('Selecione um cartão.')
    if (!arquivo) return setErro('Selecione um arquivo.')
    importar.mutate()
  }

  return (
    <div>
      <PageHeader title="Importar Fatura" subtitle="Nubank aceita CSV ou PDF. Itaú só PDF." />

      <Card className="max-w-lg space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-c-muted">Cartão</label>
          <select value={cartaoId} onChange={e => setCartaoId(e.target.value)} className={SELECT_CLS}>
            <option value="">Selecione...</option>
            {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-c-muted">Banco</label>
          <select value={banco} onChange={e => setBanco(e.target.value)} className={SELECT_CLS}>
            <option value="nubank">Nubank</option>
            <option value="itau">Itaú</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-c-muted">Mês de referência</label>
            <select value={mes} onChange={e => setMes(Number(e.target.value))} className={SELECT_CLS}>
              {MESES.map((nome, i) => <option key={i} value={i + 1}>{nome}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-c-muted">Ano</label>
            <input
              type="number" value={ano} onChange={e => setAno(Number(e.target.value))}
              className={`${SELECT_CLS} tabular-nums`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-c-muted">Arquivo</label>
          <input
            type="file" accept=".csv,.pdf"
            onChange={e => setArquivo(e.target.files?.[0] ?? null)}
            className="text-sm text-c-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-accent-500/30 file:bg-accent-500/10 file:text-accent-500 file:font-medium file:text-xs file:uppercase file:tracking-wide"
          />
        </div>

        {erro && <p className="text-sm text-overdue">{erro}</p>}

        <Button onClick={handleSubmit} disabled={importar.isPending} className="flex items-center gap-2">
          <Upload size={14} />
          {importar.isPending ? 'Importando…' : 'Importar'}
        </Button>

        {resultado && (
          <div className="pt-2 border-t border-c-border space-y-1">
            {resultado.map((r, i) => (
              <p key={i} className="text-sm text-c-primary">
                {MESES[r.mes - 1]}/{r.ano}: <strong className="text-paid">{r.linhasImportadas}</strong> linha(s) importada(s), vencimento {new Date(r.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
