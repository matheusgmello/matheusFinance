import { ChevronLeft, ChevronRight } from 'lucide-react'

export function MonthNav({ ano, mes, onNavigate }: { ano: number; mes: number; onNavigate: (delta: number) => void }) {
  const label = new Date(ano, mes - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  return (
    <div className="flex items-center justify-between">
      <button onClick={() => onNavigate(-1)} className="p-2 rounded-xl text-c-muted hover:text-c-primary hover:bg-bg-elevated transition-colors">
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-semibold uppercase tracking-wide text-c-primary">{label}</span>
      <button onClick={() => onNavigate(1)} className="p-2 rounded-xl text-c-muted hover:text-c-primary hover:bg-bg-elevated transition-colors">
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
