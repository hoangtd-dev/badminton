import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function AuthGuard() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />
  return <Outlet />
}

export function AdminGuard() {
  const { profile, loading } = useAuth()

  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
