import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RealAuthProvider } from '@/context/RealAuthProvider'
import { AuthGuard, AdminGuard } from '@/components/features/auth/AuthGuard'
import { Layout } from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import VotePage from '@/pages/VotePage'
import DashboardPage from '@/pages/DashboardPage'
import SessionsPage from '@/pages/SessionsPage'
import SessionDetailPage from '@/pages/SessionDetailPage'
import TransactionsPage from '@/pages/TransactionsPage'
import MembersPage from '@/pages/MembersPage'
import MemberDetailPage from '@/pages/MemberDetailPage'
import StatsPage from '@/pages/StatsPage'
import SettingsPage from '@/pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/vote/:token" element={<VotePage />} />
      <Route element={<AuthGuard />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route element={<AdminGuard />}>
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/:id" element={<MemberDetailPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RealAuthProvider>
          <AppRoutes />
        </RealAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
