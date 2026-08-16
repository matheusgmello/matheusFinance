import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

export type LampState = 'paid' | 'due' | 'overdue' | 'neutral'

const config: Record<LampState, { icon: typeof Circle; className: string }> = {
  paid:    { icon: CheckCircle2, className: 'text-paid' },
  due:     { icon: AlertCircle,  className: 'text-due' },
  overdue: { icon: AlertCircle,  className: 'text-overdue' },
  neutral: { icon: Circle,       className: 'text-neutral' },
}

export function Lamp({ state, size = 18 }: { state: LampState; size?: number }) {
  const { icon: Icon, className } = config[state]
  return <Icon size={size} className={`flex-shrink-0 ${className}`} />
}
