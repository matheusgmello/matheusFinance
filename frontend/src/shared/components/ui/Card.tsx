import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'normal' | 'tight' | 'none'
}

const paddingClasses = {
  normal: 'p-6',
  tight: 'p-4',
  none: '',
}

export function Card({ children, className = '', padding = 'normal' }: CardProps) {
  return (
    <div className={`bg-bg-card rounded-xl border border-c-border ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}
