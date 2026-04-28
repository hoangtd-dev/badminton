import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Transaction, TransactionType } from '@/types'

export function useTransactions(playerId?: string) {
  return useQuery({
    queryKey: ['transactions', playerId],
    queryFn: () => {
      const path = playerId ? `/api/transactions?playerId=${playerId}` : '/api/transactions'
      return api.get<Transaction[]>(path)
    },
  })
}

export function useTopUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ playerId, amount, type, description }: { playerId: string; amount: number; type: TransactionType; description: string }) =>
      api.post('/api/transactions/topup', { playerId, amount, type, description }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['members'] })
      qc.invalidateQueries({ queryKey: ['member', vars.playerId] })
    },
  })
}

export function useWithdraw() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ playerId, amount, description }: { playerId: string; amount: number; description: string }) =>
      api.post('/api/transactions/withdraw', { playerId, amount, description }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['members'] })
      qc.invalidateQueries({ queryKey: ['member', vars.playerId] })
    },
  })
}

export function useExportTransactions() {
  return async (transactions: Transaction[]) => {
    const header = ['Date', 'Player', 'Type', 'Amount (AUD)', 'Description']
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleDateString('en-AU'),
      t.profile?.full_name ?? t.player_id,
      t.type,
      t.amount.toFixed(2),
      t.description ?? '',
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
}

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  topup: 'Top-up',
  court_fee: 'Court Fee',
  shuttlecock: 'Shuttlecock',
  water: 'Water',
  other: 'Other',
}

export const TRANSACTION_COLORS: Record<TransactionType, string> = {
  topup: 'text-accent',
  court_fee: 'text-danger',
  shuttlecock: 'text-warning',
  water: 'text-info',
  other: 'text-muted',
}

export const TRANSACTION_BG: Record<TransactionType, string> = {
  topup: 'bg-accent/13 text-accent',
  court_fee: 'bg-danger/13 text-danger',
  shuttlecock: 'bg-warning/13 text-warning',
  water: 'bg-info/13 text-info',
  other: 'bg-muted/13 text-muted',
}
