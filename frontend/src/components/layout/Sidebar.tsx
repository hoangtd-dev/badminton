import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/dashboard', icon: GridIcon, label: 'Dashboard' },
  { to: '/sessions', icon: CalendarIcon, label: 'Sessions' },
  { to: '/transactions', icon: WalletIcon, label: 'Transactions' },
  { to: '/stats', icon: ChartIcon, label: 'My Stats' },
]

const adminItems = [
  { to: '/members', icon: UsersIcon, label: 'Members' },
]

export function Sidebar() {
  const { profile, signOut, isAdmin } = useAuth()

  return (
    <aside className="hidden md:flex flex-col w-60 bg-surface-alt border-r border-border h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/13 border border-accent/25 flex items-center justify-center">
            <span className="text-accent text-lg">🏸</span>
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-primary">Badminton</h1>
            <p className="text-xs text-muted">Group Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-accent/8 text-accent border border-accent/19'
                  : 'text-muted hover:text-primary hover:bg-card-hover'
              )
            }
          >
            <Icon className="w-4.5 h-4.5" />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-xs font-medium text-muted uppercase tracking-wider px-3">Admin</p>
            </div>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                    isActive
                      ? 'bg-accent/8 text-accent border border-accent/19'
                      : 'text-muted hover:text-primary hover:bg-card-hover'
                  )
                }
              >
                <Icon className="w-4.5 h-4.5" />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-1',
              isActive
                ? 'bg-accent/8 text-accent border border-accent/19'
                : 'text-muted hover:text-primary hover:bg-card-hover'
            )
          }
        >
          <SettingsIcon className="w-4.5 h-4.5" />
          Settings
        </NavLink>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent/13 border border-accent/25 flex items-center justify-center text-xs font-bold text-accent">
            {profile?.full_name?.slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate">{profile?.full_name}</p>
            <p className="text-xs text-muted capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={signOut}
            className="text-muted hover:text-danger transition-colors p-1 rounded"
            title="Sign out"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const { isAdmin } = useAuth()
  const items = [
    { to: '/dashboard', icon: GridIcon, label: 'Home' },
    { to: '/sessions', icon: CalendarIcon, label: 'Sessions' },
    { to: '/transactions', icon: WalletIcon, label: 'Wallet' },
    { to: '/stats', icon: ChartIcon, label: 'Stats' },
    ...(isAdmin ? [{ to: '/members', icon: UsersIcon, label: 'Members' }] : []),
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-alt border-t border-border z-40">
      <div className="flex">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors',
                isActive ? 'text-accent' : 'text-muted'
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  )
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-3" strokeLinecap="round" />
      <path d="M15 12h6v4h-6a2 2 0 110-4z" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16l4-4 4 4 4-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
