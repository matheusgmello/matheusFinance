import { ReactNode } from 'react'

interface CardProps { children: ReactNode; className?: string }

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-bg-card rounded-2xl border border-c-border p-6 shadow-sm dark:shadow-lg ${className}`}>
      {children}
    </div>
  )
}
