import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { cartoesApi } from '../../domains/cartao/api'
import { faturaApi, ResultadoImportFatura } from '../../domains/compra/api'
import { Card } from '../../shared/components/ui/Card'
import { Button } from '../../shared/components/ui/Button'
import { PageHeader } from '../../shared/components/ui/PageHeader'
import { Upload } from 'lucide-react'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const SELECT_CLS = 'bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500'

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
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Cartão</label>
          <select value={cartaoId} onChange={e => setCartaoId(e.target.value)} className={SELECT_CLS}>
            <option value="">Selecione...</option>
            {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Banco</label>
          <select value={banco} onChange={e => setBanco(e.target.value)} className={SELECT_CLS}>
            <option value="nubank">Nubank</option>
            <option value="itau">Itaú</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Mês de referência</label>
            <select value={mes} onChange={e => setMes(Number(e.target.value))} className={SELECT_CLS}>
              {MESES.map((nome, i) => <option key={i} value={i + 1}>{nome}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Ano</label>
            <input
              type="number" value={ano} onChange={e => setAno(Number(e.target.value))}
              className={SELECT_CLS}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Arquivo</label>
          <input
            type="file" accept=".csv,.pdf"
            onChange={e => setArquivo(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-700 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-accent-500/15 file:text-accent-600 dark:file:text-accent-400 file:font-medium"
          />
        </div>

        {erro && <p className="text-sm text-rose-500">{erro}</p>}

        <Button onClick={handleSubmit} disabled={importar.isPending} className="flex items-center gap-2">
          <Upload size={16} />
          {importar.isPending ? 'Importando…' : 'Importar'}
        </Button>

        {resultado && (
          <div className="pt-2 border-t border-gray-200 dark:border-slate-700 space-y-1">
            {resultado.map((r, i) => (
              <p key={i} className="text-sm text-gray-700 dark:text-slate-300">
                {MESES[r.mes - 1]}/{r.ano}: <strong>{r.linhasImportadas}</strong> linha(s) importada(s), vencimento {new Date(r.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
