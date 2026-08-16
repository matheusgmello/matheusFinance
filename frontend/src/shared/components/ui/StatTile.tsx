import { ReactNode } from 'react'
import { Card } from './Card'

type Tone = 'paid' | 'due' | 'overdue' | 'accent' | 'neutral'

const toneClasses: Record<Tone, string> = {
  paid: 'text-paid',
  due: 'text-due',
  overdue: 'text-overdue',
  accent: 'text-accent-500',
  neutral: 'text-c-primary',
}

interface StatTileProps {
  label: string
  value: ReactNode
  tone?: Tone
  sub?: ReactNode
}

export function StatTile({ label, value, tone = 'neutral', sub }: StatTileProps) {
  return (
    <Card padding="tight" className="text-center min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-c-muted mb-1">{label}</p>
      <p className={`text-base sm:text-xl font-bold tabular-nums truncate ${toneClasses[tone]}`}>{value}</p>
      {sub && <p className="text-xs text-c-muted mt-0.5 truncate">{sub}</p>}
    </Card>
  )
}
