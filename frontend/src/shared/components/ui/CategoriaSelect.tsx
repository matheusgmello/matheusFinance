import { useQuery } from '@tanstack/react-query'
import { categoriasApi, CORES } from '../../../domains/configuracao/api'
import { useProfile } from '../../context/ProfileContext'

const dot = (cor: string) => CORES.find(c => c.value === cor)?.tw ?? 'bg-slate-500'

const SELECT_CLS = 'bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500 w-full'

interface Props {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function CategoriaSelect({ value, onChange, label = 'Categoria', placeholder = 'Sem categoria' }: Props) {
  const { activeProfile } = useProfile()
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', activeProfile?.id],
    queryFn: categoriasApi.listar,
    enabled: !!activeProfile,
  })

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        {value && (
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${dot(categorias.find(c => c.nome === value)?.cor ?? '')}`} />
        )}
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`${SELECT_CLS} ${value ? 'pl-8' : ''}`}
        >
          <option value="">{placeholder}</option>
          {categorias.map(c => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
