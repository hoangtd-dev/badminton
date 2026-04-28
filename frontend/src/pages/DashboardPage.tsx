import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSessions } from '@/hooks/useSessions'
import { useTransactions } from '@/hooks/useTransactions'
import { useMembers, getMemberStatus } from '@/hooks/useMembers'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatAUD, formatDateTime, formatRelativeTime } from '@/lib/utils'
import { TRANSACTION_BG, TRANSACTION_LABELS } from '@/hooks/useTransactions'

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const { data: sessions } = useSessions()
  const { data: transactions } = useTransactions(isAdmin ? undefined : profile?.id)
  const { data: members } = useMembers()

  const upcomingSession = sessions?.find(s => s.status === 'upcoming' || s.status === 'ongoing')
  const recentTx = (transactions ?? []).slice(0, 5)
  const lowBalanceMembers = (members ?? []).filter(m => getMemberStatus(m) !== 'ok')
  const totalGroupBalance = (members ?? []).reduce((sum, m) => sum + m.balance, 0)
  const thisMonthSessions = sessions?.filter(s => {
    const d = new Date(s.played_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && s.status === 'completed'
  }) ?? []

  const isLowBalance = profile && profile.balance < profile.low_balance_threshold

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-display font-bold text-primary">
          Welcome back, {profile?.full_name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-muted mt-0.5">Here's what's happening with your group</p>
      </div>

      {/* Low balance warning for regular users */}
      {!isAdmin && isLowBalance && (
        <div className="bg-warning/8 border border-warning/25 rounded-xl px-4 py-3.5 flex items-start gap-3">
          <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-warning">Low balance — {formatAUD(profile.balance)}</p>
            <p className="text-xs text-muted mt-0.5">Your balance is below the threshold of {formatAUD(profile.low_balance_threshold)}. Please contact your admin to top up.</p>
          </div>
        </div>
      )}

      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Balance */}
        <Card
          glow={!!profile && profile.balance >= profile.low_balance_threshold}
          className={profile && profile.balance < profile.low_balance_threshold
            ? 'border-warning/25 shadow-[0_0_20px_rgba(255,170,0,0.06)]'
            : ''
          }
        >
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Your Balance</p>
          <p className={`text-3xl font-display font-bold ${profile && profile.balance < profile.low_balance_threshold ? 'text-warning' : 'text-accent'}`}>
            {formatAUD(profile?.balance ?? 0)}
          </p>
          {profile && profile.balance < profile.low_balance_threshold && (
            <p className="text-xs text-warning mt-1">Below threshold — top up soon</p>
          )}
        </Card>

        {/* This month */}
        <Card>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">This Month</p>
          <p className="text-3xl font-display font-bold text-primary">{thisMonthSessions.length}</p>
          <p className="text-xs text-muted mt-1">sessions played</p>
        </Card>

        {/* Admin: group balance */}
        {isAdmin ? (
          <Card>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Group Balance</p>
            <p className="text-3xl font-display font-bold text-info">{formatAUD(totalGroupBalance)}</p>
            {lowBalanceMembers.length > 0 && (
              <p className="text-xs text-warning mt-1">{lowBalanceMembers.length} member(s) low on funds</p>
            )}
          </Card>
        ) : (
          <Card>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Sessions Attended</p>
            <p className="text-3xl font-display font-bold text-primary">
              {sessions?.filter(s => s.status === 'completed').length ?? 0}
            </p>
            <p className="text-xs text-muted mt-1">total</p>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming session */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-primary">Next Session</h3>
            <Link to="/sessions" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {upcomingSession ? (
            <div className="space-y-3">
              <div>
                <p className="font-medium text-primary">{upcomingSession.title}</p>
                <p className="text-sm text-muted mt-0.5">{formatDateTime(upcomingSession.played_at)}</p>
                {upcomingSession.location && (
                  <p className="text-xs text-muted flex items-center gap-1 mt-1">
                    📍 {upcomingSession.location}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={upcomingSession.status === 'ongoing' ? 'warning' : 'info'}>
                  {upcomingSession.status === 'ongoing' ? '🔴 Live' : `⏰ ${formatRelativeTime(upcomingSession.played_at)}`}
                </Badge>
                <Link to={`/sessions/${upcomingSession.id}`}>
                  <Button size="sm">View Session</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-4xl mb-2">🏸</p>
              <p className="text-sm text-muted">No upcoming sessions</p>
              {isAdmin && (
                <Link to="/sessions">
                  <Button size="sm" variant="secondary" className="mt-3">Create Session</Button>
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Recent transactions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-primary">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {recentTx.length > 0 ? (
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${TRANSACTION_BG[tx.type]}`}>
                      {TRANSACTION_LABELS[tx.type]}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(tx.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${tx.amount > 0 ? 'text-accent' : 'text-danger'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatAUD(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-6">No transactions yet</p>
          )}
        </Card>
      </div>

      {/* Admin: low balance alerts */}
      {isAdmin && lowBalanceMembers.length > 0 && (
        <Card className="border-warning/19">
          <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <span className="text-warning">⚠️</span> Low Balance Alerts
          </h3>
          <div className="space-y-2">
            {lowBalanceMembers.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-surface-alt rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-warning/13 flex items-center justify-center text-xs font-bold text-warning">
                    {m.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-primary">{m.full_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold tabular-nums ${getMemberStatus(m) === 'empty' ? 'text-danger' : 'text-warning'}`}>
                    {formatAUD(m.balance)}
                  </span>
                  <Link to={`/members/${m.id}`}>
                    <Button size="sm" variant="secondary">Top Up</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
