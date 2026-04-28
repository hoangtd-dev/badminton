import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMember, useUpdateMember, getMemberStatus } from '@/hooks/useMembers'
import { useTransactions, useTopUp, useWithdraw, TRANSACTION_BG, TRANSACTION_LABELS } from '@/hooks/useTransactions'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatAUD, getInitials } from '@/lib/utils'

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile: me } = useAuth()
  const { data: member, isLoading } = useMember(id!)
  const { data: transactions } = useTransactions(id)
  const topUp = useTopUp()
  const withdraw = useWithdraw()
  const updateMember = useUpdateMember()

  const [showTopUp, setShowTopUp] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [topUpForm, setTopUpForm] = useState({ amount: '', description: '' })
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', description: '' })
  const [settingsForm, setSettingsForm] = useState({ low_balance_threshold: '' })
  const [error, setError] = useState('')

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-48 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!member) return <div className="text-muted text-center py-16">Member not found</div>

  const status = getMemberStatus(member)

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!me) return
    try {
      await topUp.mutateAsync({
        playerId: member!.id,
        amount: parseFloat(topUpForm.amount),
        type: 'topup',
        description: topUpForm.description || 'Manual top-up',
      })
      setShowTopUp(false)
      setTopUpForm({ amount: '', description: '' })
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!me) return
    try {
      await withdraw.mutateAsync({
        playerId: member!.id,
        amount: parseFloat(withdrawForm.amount),
        description: withdrawForm.description || 'Manual withdrawal',
      })
      setShowWithdraw(false)
      setWithdrawForm({ amount: '', description: '' })
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    await updateMember.mutateAsync({
      id: member!.id,
      low_balance_threshold: parseFloat(settingsForm.low_balance_threshold),
    })
    setShowSettings(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/members" className="text-muted hover:text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-xl font-display font-bold text-primary">Member Detail</h2>
      </div>

      {/* Profile card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-accent/8 border border-accent/19 flex items-center justify-center text-lg font-bold text-accent">
            {getInitials(member.full_name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-primary">{member.full_name}</h3>
              <Badge variant={member.role === 'admin' ? 'info' : 'default'}>{member.role}</Badge>
              <Badge variant={status === 'ok' ? 'success' : status === 'low' ? 'warning' : 'danger'}>
                {status === 'ok' ? 'Good' : status === 'low' ? 'Low Balance' : 'Empty'}
              </Badge>
            </div>
            <p className="text-sm text-muted mt-0.5">{member.phone ?? 'No phone'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Balance</p>
            <p className={`text-2xl font-display font-bold mt-1 ${
              status === 'empty' ? 'text-danger' : status === 'low' ? 'text-warning' : 'text-accent'
            }`}>
              {formatAUD(member.balance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Low Balance Alert</p>
            <p className="text-2xl font-display font-bold text-primary mt-1">
              {formatAUD(member.low_balance_threshold)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <Button size="sm" onClick={() => setShowTopUp(true)}>+ Top Up</Button>
          <Button size="sm" variant="danger" onClick={() => setShowWithdraw(true)}>− Withdraw</Button>
          <Button size="sm" variant="secondary" onClick={() => {
            setSettingsForm({ low_balance_threshold: member.low_balance_threshold.toString() })
            setShowSettings(true)
          }}>
            Settings
          </Button>
        </div>
      </Card>

      {/* Transaction history */}
      <Card className="overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-primary">Transaction History</h3>
        </div>
        {(transactions ?? []).length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(transactions ?? []).map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-card-hover transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TRANSACTION_BG[tx.type]}`}>
                    {TRANSACTION_LABELS[tx.type]}
                  </span>
                  <div>
                    <p className="text-sm text-primary">{tx.description ?? '—'}</p>
                    <p className="text-xs text-muted">
                      {new Date(tx.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${tx.amount > 0 ? 'text-accent' : 'text-danger'}`}>
                  {tx.amount > 0 ? '+' : ''}{formatAUD(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Top up modal */}
      <Modal open={showTopUp} onClose={() => setShowTopUp(false)} title={`Top Up — ${member.full_name}`}>
        <form onSubmit={handleTopUp} className="space-y-4">
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
            label="Description"
            placeholder="e.g. Cash payment"
            value={topUpForm.description}
            onChange={e => setTopUpForm(f => ({ ...f, description: e.target.value }))}
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowTopUp(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={topUp.isPending} className="flex-1">Top Up</Button>
          </div>
        </form>
      </Modal>

      {/* Withdraw modal */}
      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title={`Withdraw — ${member.full_name}`}>
        <p className="text-xs text-muted mb-4">Use this to correct a wrong top-up or remove a member's remaining balance.</p>
        <form onSubmit={handleWithdraw} className="space-y-4">
          <Input
            label="Amount to Withdraw (AUD)"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            prefix="$"
            value={withdrawForm.amount}
            onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))}
            required
          />
          <Input
            label="Reason"
            placeholder="e.g. Left the group / Wrong top-up"
            value={withdrawForm.description}
            onChange={e => setWithdrawForm(f => ({ ...f, description: e.target.value }))}
            required
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowWithdraw(false)} className="flex-1">Cancel</Button>
            <Button type="submit" variant="danger" loading={withdraw.isPending} className="flex-1">Withdraw</Button>
          </div>
        </form>
      </Modal>

      {/* Settings modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Member Settings">
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <Input
            label="Low Balance Threshold (AUD)"
            type="number"
            min="0"
            step="0.01"
            placeholder="25.00"
            prefix="$"
            value={settingsForm.low_balance_threshold}
            onChange={e => setSettingsForm(f => ({ ...f, low_balance_threshold: e.target.value }))}
          />
          <p className="text-xs text-muted">
            Send a warning notification when balance drops below this amount.
          </p>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowSettings(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={updateMember.isPending} className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
