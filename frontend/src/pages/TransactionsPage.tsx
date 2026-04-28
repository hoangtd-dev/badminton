import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTransactions, useTopUp, useExportTransactions, TRANSACTION_BG, TRANSACTION_LABELS } from '@/hooks/useTransactions'
import { useMembers } from '@/hooks/useMembers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { formatAUD } from '@/lib/utils'
import type { TransactionType } from '@/types'

export default function TransactionsPage() {
  const { profile, isAdmin } = useAuth()
  const { data: transactions, isLoading } = useTransactions(isAdmin ? undefined : profile?.id)
  const { data: members } = useMembers()
  const topUp = useTopUp()
  const exportTransactions = useExportTransactions()

  const [showTopUp, setShowTopUp] = useState(false)
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all')
  const [topUpForm, setTopUpForm] = useState({ playerId: '', amount: '', type: 'topup' as TransactionType, description: '' })
  const [topUpError, setTopUpError] = useState('')

  const filtered = (transactions ?? []).filter(tx =>
    filterType === 'all' ? true : tx.type === filterType
  )

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault()
    setTopUpError('')
    if (!profile) return
    try {
      await topUp.mutateAsync({
        playerId: topUpForm.playerId,
        amount: parseFloat(topUpForm.amount),
        type: topUpForm.type,
        description: topUpForm.description || 'Manual top-up',
      })
      setShowTopUp(false)
      setTopUpForm({ playerId: '', amount: '', type: 'topup', description: '' })
    } catch (e: any) {
      setTopUpError(e.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-primary">Transactions</h2>
          <p className="text-sm text-muted mt-0.5">
            {isAdmin ? 'All group transactions' : 'Your transaction history'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="secondary" size="sm" onClick={() => exportTransactions(filtered)}>
                Export CSV
              </Button>
              <Button size="sm" onClick={() => setShowTopUp(true)}>+ Top Up</Button>
            </>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'topup', 'court_fee', 'shuttlecock', 'water', 'other'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === type
                ? 'bg-accent text-surface'
                : 'bg-card border border-border text-muted hover:text-primary'
            }`}
          >
            {type === 'all' ? 'All' : TRANSACTION_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-surface-alt rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-muted">No transactions found</p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map(tx => (
                <div key={tx.id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${TRANSACTION_BG[tx.type]}`}>
                      {TRANSACTION_LABELS[tx.type]}
                    </span>
                    <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-accent' : 'text-danger'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatAUD(tx.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted truncate flex-1">{tx.description ?? '—'}</p>
                    <p className="text-xs text-muted shrink-0">
                      {new Date(tx.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </p>
                  </div>
                  {isAdmin && tx.profile?.full_name && (
                    <p className="text-xs text-muted/70 mt-0.5">{tx.profile.full_name}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted px-5 py-3 uppercase tracking-wider">Date</th>
                    {isAdmin && <th className="text-left text-xs font-medium text-muted px-5 py-3 uppercase tracking-wider">Member</th>}
                    <th className="text-left text-xs font-medium text-muted px-5 py-3 uppercase tracking-wider">Type</th>
                    <th className="text-left text-xs font-medium text-muted px-5 py-3 uppercase tracking-wider">Description</th>
                    <th className="text-right text-xs font-medium text-muted px-5 py-3 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(tx => (
                    <tr key={tx.id} className="hover:bg-card-hover transition-colors">
                      <td className="px-5 py-3 text-sm text-muted whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3 text-sm text-primary">
                          {tx.profile?.full_name ?? '—'}
                        </td>
                      )}
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TRANSACTION_BG[tx.type]}`}>
                          {TRANSACTION_LABELS[tx.type]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted max-w-50 truncate">
                        {tx.description ?? '—'}
                      </td>
                      <td className={`px-5 py-3 text-sm font-semibold text-right ${tx.amount > 0 ? 'text-accent' : 'text-danger'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatAUD(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Top Up Modal */}
      <Modal open={showTopUp} onClose={() => setShowTopUp(false)} title="Top Up Balance">
        <form onSubmit={handleTopUp} className="space-y-4">
          <Select
            label="Member"
            value={topUpForm.playerId}
            onChange={e => setTopUpForm(f => ({ ...f, playerId: e.target.value }))}
            required
          >
            <option value="">Select a member...</option>
            {(members ?? []).map(m => (
              <option key={m.id} value={m.id}>
                {m.full_name} — {formatAUD(m.balance)}
              </option>
            ))}
          </Select>
          <Select
            label="Transaction Type"
            value={topUpForm.type}
            onChange={e => setTopUpForm(f => ({ ...f, type: e.target.value as TransactionType }))}
            required
          >
            {(Object.keys(TRANSACTION_LABELS) as TransactionType[]).map(t => (
              <option key={t} value={t}>{TRANSACTION_LABELS[t]}</option>
            ))}
          </Select>
          <Input
            label="Amount (AUD)"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            prefix="$"
            value={topUpForm.amount}
            onChange={e => setTopUpForm(f => ({ ...f, amount: e.target.value }))}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="e.g. Cash payment"
            value={topUpForm.description}
            onChange={e => setTopUpForm(f => ({ ...f, description: e.target.value }))}
          />
          {topUpError && <p className="text-xs text-danger">{topUpError}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowTopUp(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={topUp.isPending} className="flex-1">Top Up</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
