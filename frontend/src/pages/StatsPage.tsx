import { useAuth } from '@/hooks/useAuth'
import { useSessions } from '@/hooks/useSessions'
import { useTransactions } from '@/hooks/useTransactions'
import { Card } from '@/components/ui/Card'
import { formatAUD } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function StatsPage() {
  const { profile } = useAuth()
  const { data: sessions } = useSessions()
  const { data: transactions } = useTransactions(profile?.id)

  const now = new Date()
  const thisMonth = (sessions ?? []).filter(s => {
    const d = new Date(s.played_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && s.status === 'completed'
  })
  const totalSessions = (sessions ?? []).filter(s => s.status === 'completed').length

  const thisMonthSpend = (transactions ?? [])
    .filter(t => {
      const d = new Date(t.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.amount < 0
    })
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const totalSpend = (transactions ?? [])
    .filter(t => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  // Monthly spend chart — last 6 months
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const month = d.toLocaleString('en-AU', { month: 'short' })
    const spend = (transactions ?? [])
      .filter(t => {
        const td = new Date(t.created_at)
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && t.amount < 0
      })
      .reduce((s, t) => s + Math.abs(t.amount), 0)
    return { month, spend }
  })

  // Attendance rate
  const completedSessions = (sessions ?? []).filter(s => s.status === 'completed')
  const attendanceRate = completedSessions.length > 0
    ? Math.round((thisMonth.length / Math.max(completedSessions.length, 1)) * 100)
    : 0

  // Streak: count consecutive sessions attended from most recent
  let streak = 0
  const sortedCompleted = [...completedSessions].sort(
    (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-display font-bold text-primary">My Stats</h2>
        <p className="text-sm text-muted mt-0.5">Your personal performance & spending</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Sessions (Month)</p>
          <p className="text-2xl font-display font-bold text-primary">{thisMonth.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Sessions (Total)</p>
          <p className="text-2xl font-display font-bold text-primary">{totalSessions}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Spent (Month)</p>
          <p className="text-2xl font-display font-bold text-danger">{formatAUD(thisMonthSpend)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Spent (Total)</p>
          <p className="text-2xl font-display font-bold text-muted">{formatAUD(totalSpend)}</p>
        </Card>
      </div>

      {/* Attendance rate & streak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Attendance Rate</p>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-display font-bold text-accent">{attendanceRate}%</p>
            <p className="text-sm text-muted mb-1">this month</p>
          </div>
          <div className="mt-3 h-2 bg-surface-alt rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Current Balance</p>
          <p className={`text-4xl font-display font-bold ${
            profile && profile.balance < profile.low_balance_threshold ? 'text-warning' : 'text-accent'
          }`}>
            {formatAUD(profile?.balance ?? 0)}
          </p>
          <p className="text-xs text-muted mt-2">
            Threshold: {formatAUD(profile?.low_balance_threshold ?? 0)}
          </p>
        </Card>
      </div>

      {/* Monthly spend chart */}
      <Card>
        <h3 className="text-sm font-semibold text-primary mb-4">Monthly Spending (AUD)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-primary)',
                fontSize: '13px',
              }}
              formatter={(value) => [formatAUD(Number(value ?? 0)), 'Spent']}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
              {monthlyData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={index === monthlyData.length - 1 ? 'var(--color-accent)' : 'var(--color-border)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
