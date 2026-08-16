import { ReactNode } from 'react'

type Color = 'accent' | 'rose' | 'amber' | 'slate'

const colorClasses: Record<Color, string> = {
  accent: 'bg-paid/10 text-paid border-paid/30',
  rose:   'bg-overdue/10 text-overdue border-overdue/30',
  amber:  'bg-due/10 text-due border-due/30',
  slate:  'bg-neutral/10 text-neutral border-neutral/30',
}

export function Badge({ children, color = 'slate' }: { children: ReactNode; color?: Color }) {
  return (
    <span className={`text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${colorClasses[color]}`}>
      {children}
    </span>
  )
}
