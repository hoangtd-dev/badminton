export function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffMs < 0) {
    const absDays = Math.abs(diffDays)
    if (absDays === 0) return 'Today'
    if (absDays === 1) return 'Yesterday'
    return `${absDays} days ago`
  }

  if (diffHrs < 1) return 'In less than an hour'
  if (diffHrs < 24) return `In ${diffHrs} hours`
  if (diffDays === 1) return 'Tomorrow'
  return `In ${diffDays} days`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
