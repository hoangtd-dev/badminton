import { Outlet, Link } from 'react-router-dom'
import { Sidebar, BottomNav } from './Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { formatAUD } from '@/lib/utils'

export function Layout() {
  const { profile, isAdmin } = useAuth()
  const isLowBalance = profile && profile.balance < profile.low_balance_threshold

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-alt border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏸</span>
            <span className="font-display font-bold text-primary text-sm">Badminton</span>
          </div>
          <Link to="/settings" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="text-right">
              <p className="text-xs font-medium text-primary leading-tight">{profile?.full_name}</p>
              <p className="text-xs text-muted capitalize leading-tight">{profile?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent/13 border border-accent/25 flex items-center justify-center text-xs font-bold text-accent">
              {profile?.full_name?.slice(0, 2).toUpperCase() ?? '??'}
            </div>
          </Link>
        </div>

        {isAdmin && isLowBalance && (
          <div className="bg-warning/8 border-b border-warning/19 px-4 py-2.5 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-warning">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>Low balance: <strong>{formatAUD(profile.balance)}</strong> — Please top up soon</span>
            </div>
            <a href="/transactions" className="text-xs underline text-warning hover:text-warning-hover">
              Top up →
            </a>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
