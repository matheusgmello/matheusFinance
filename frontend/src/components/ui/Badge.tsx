import { ReactNode } from 'react'

type Color = 'accent' | 'rose' | 'amber' | 'slate'

const colorClasses: Record<Color, string> = {
  accent: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
  rose:   'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  amber:  'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  slate:  'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300',
}

export function Badge({ children, color = 'slate' }: { children: ReactNode; color?: Color }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClasses[color]}`}>
      {children}
    </span>
  )
}
