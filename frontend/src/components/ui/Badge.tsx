import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
  className?: string
}

const variants = {
  success: 'bg-accent/13 text-accent border-accent/19',
  warning: 'bg-warning/13 text-warning border-warning/19',
  danger: 'bg-danger/13 text-danger border-danger/19',
  info: 'bg-info/13 text-info border-info/19',
  default: 'bg-muted/13 text-muted border-muted/19',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
