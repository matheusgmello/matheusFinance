import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-c-border">
      <div>
        <h1 className="text-xl font-semibold uppercase tracking-wide text-c-primary">{title}</h1>
        {subtitle && <p className="text-sm text-c-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
