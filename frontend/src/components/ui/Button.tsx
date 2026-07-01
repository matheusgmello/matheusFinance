import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent-500 hover:bg-accent-400 text-white',
  danger:  'bg-rose-500 hover:bg-rose-400 text-white',
  ghost:   'border border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-400 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700',
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`font-semibold rounded-xl px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
