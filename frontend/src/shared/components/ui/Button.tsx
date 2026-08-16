import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent-500 hover:bg-accent-400 text-white border border-accent-500',
  danger:  'bg-overdue hover:brightness-110 text-white border border-overdue',
  ghost:   'border border-c-border text-c-muted hover:text-c-primary hover:border-accent-500',
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`font-semibold text-xs uppercase tracking-wider rounded-xl px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
