import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export function Card({ className, glow, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-5',
        glow && 'border-accent/25 shadow-[0_0_20px_rgba(0,229,160,0.06)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
