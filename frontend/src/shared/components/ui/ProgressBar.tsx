type Tone = 'paid' | 'due' | 'overdue' | 'accent'

const toneClasses: Record<Tone, string> = {
  paid: 'bg-paid',
  due: 'bg-due',
  overdue: 'bg-overdue',
  accent: 'bg-accent-500',
}

export function ProgressBar({ pct, tone = 'accent' }: { pct: number; tone?: Tone }) {
  return (
    <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${toneClasses[tone]}`}
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
      />
    </div>
  )
}
