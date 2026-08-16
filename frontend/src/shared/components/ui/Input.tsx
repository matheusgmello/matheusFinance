import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', type, ...props }: InputProps) {
  const numeric = type === 'number' || type === 'date'
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold uppercase tracking-wide text-c-muted">{label}</label>}
      <input
        type={type}
        {...props}
        className={`bg-bg-elevated border ${error ? 'border-overdue' : 'border-c-border'} rounded-xl px-3 py-2 text-c-primary placeholder-c-muted/60 focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500 ${numeric ? 'tabular-nums' : ''} ${className}`}
      />
      {error && <span className="text-xs text-overdue">{error}</span>}
    </div>
  )
}
