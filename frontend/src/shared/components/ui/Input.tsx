import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>}
      <input
        {...props}
        className={`bg-gray-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-gray-300 dark:border-slate-600'} rounded-xl px-4 py-2 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500 ${className}`}
      />
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  )
}
