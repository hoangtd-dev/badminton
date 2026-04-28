import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  useSession, useCheckIn, useRemoveCheckIn, useAddExpense, useFinalizeSession,
  useDeleteSession,
} from '@/hooks/useSessions'
import { useMembers } from '@/hooks/useMembers'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { formatAUD, formatDateTime, getInitials } from '@/lib/utils'
import type { ExpenseCategory } from '@/types'

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  court_fee: '🏟️ Court Fee',
  shuttlecock: '🏸 Shuttlecock',
  water: '💧 Water',
  other: '📦 Other',
}

function getHoursOptions(duration: number): number[] {
  const opts: number[] = []
  for (let h = 0.5; h <= duration; h += 0.5) opts.push(Math.round(h * 10) / 10)
  return opts
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, isAdmin } = useAuth()
  const { data: session, isLoading } = useSession(id!)
  const { data: allMembers } = useMembers()
  const checkIn = useCheckIn()
  const removeCheckIn = useRemoveCheckIn()
  const addExpense = useAddExpense()
  const finalizeSession = useFinalizeSession()
  const deleteSession = useDeleteSession()

  const [showExpense, setShowExpense] = useState(false)
  const [showCheckInFor, setShowCheckInFor] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selfCheckInHours, setSelfCheckInHours] = useState<number | null>(null)
  const [checkInForTarget, setCheckInForTarget] = useState<{ id: string; name: string } | null>(null)
  const [checkInForHours, setCheckInForHours] = useState<number | null>(null)
  const [expenseForm, setExpenseForm] = useState({
    category: 'court_fee' as ExpenseCategory,
    amount: '',
    note: '',
    splitType: 'equal' as 'equal' | 'custom',
    customMode: 'equal_selected' as 'equal_selected' | 'manual',
    customTotal: '',
    selectedPlayers: new Set<string>(),
    allocations: {} as Record<string, string>,
  })
  const [expenseError, setExpenseError] = useState('')
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [voteLinkCopied, setVoteLinkCopied] = useState(false)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-64 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!session) return <div className="text-muted text-center py-16">Session not found</div>

  const checkedIn = (session.attendances ?? []).filter(a => a.checked_in_at)
  const sharedExpenses = (session.group_expenses ?? []).filter(e => !e.player_id)
  const customExpenses = (session.group_expenses ?? []).filter(e => e.player_id)
  const totalShared = sharedExpenses.reduce((s, e) => s + e.amount, 0)
  const totalCustom = customExpenses.reduce((s, e) => s + e.amount, 0)
  const totalExpenses = totalShared + totalCustom
  const sharedCostPerPlayer = checkedIn.length > 0 ? totalShared / checkedIn.length : 0
  const myAttendance = (session.attendances ?? []).find(a => a.player_id === profile?.id)
  const hasCheckedIn = !!myAttendance?.checked_in_at
  const isCompleted = session.status === 'completed'
  const notAttendingMembers = allMembers?.filter(
    m => !(session.attendances ?? []).some(a => a.player_id === m.id)
  ) ?? []

  async function handleCheckIn() {
    if (!profile) return
    const duration = session!.duration_hours ?? 2
    const hours = selfCheckInHours ?? duration
    await checkIn.mutateAsync({ sessionId: session!.id, playerId: profile.id, hoursAttended: hours })
  }

  async function handleCheckInFor(playerId: string, hours: number) {
    await checkIn.mutateAsync({ sessionId: session!.id, playerId, hoursAttended: hours })
    setShowCheckInFor(false)
    setCheckInForTarget(null)
    setCheckInForHours(null)
  }

  async function handleRemoveCheckIn(playerId: string) {
    await removeCheckIn.mutateAsync({ sessionId: session!.id, playerId })
  }

  function openExpenseModal() {
    const initialAllocations: Record<string, string> = {}
    checkedIn.forEach(att => { initialAllocations[att.player_id] = '' })
    setExpenseForm({
      category: 'court_fee', amount: '', note: '', splitType: 'equal',
      customMode: 'equal_selected', customTotal: '',
      selectedPlayers: new Set(checkedIn.map(a => a.player_id)),
      allocations: initialAllocations,
    })
    setExpenseError('')
    setShowExpense(true)
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    setExpenseError('')
    try {
      if (expenseForm.splitType === 'custom') {
        let allocations: { player_id: string; amount: number }[]
        if (expenseForm.customMode === 'equal_selected') {
          const selected = checkedIn.filter(att => expenseForm.selectedPlayers.has(att.player_id))
          if (selected.length === 0) { setExpenseError('Select at least one player'); return }
          const total = parseFloat(expenseForm.customTotal)
          if (!total || total <= 0) { setExpenseError('Enter a total amount'); return }
          const share = Math.round((total / selected.length) * 100) / 100
          allocations = selected.map(att => ({ player_id: att.player_id, amount: share }))
        } else {
          allocations = checkedIn
            .map(att => ({ player_id: att.player_id, amount: parseFloat(expenseForm.allocations[att.player_id] || '0') }))
            .filter(a => a.amount > 0)
          if (allocations.length === 0) { setExpenseError('Enter at least one amount'); return }
        }
        await addExpense.mutateAsync({
          session_id: session!.id,
          category: expenseForm.category,
          note: expenseForm.note || null,
          split_type: 'custom',
          allocations,
        })
      } else {
        await addExpense.mutateAsync({
          session_id: session!.id,
          category: expenseForm.category,
          amount: parseFloat(expenseForm.amount),
          note: expenseForm.note || null,
          split_type: 'equal',
        })
      }
      setShowExpense(false)
    } catch (err: any) {
      setExpenseError(err.message)
    }
  }

  async function handleFinalize() {
    setFinalizeLoading(true)
    try {
      await finalizeSession.mutateAsync(session!.id)
    } catch (e) {
      console.error(e)
    } finally {
      setFinalizeLoading(false)
    }
  }

  async function handleDelete() {
    await deleteSession.mutateAsync(session!.id)
    navigate('/sessions')
  }

  async function handleCopyVoteLink() {
    const link = `${window.location.origin}/vote/${session!.vote_token}`
    await navigator.clipboard.writeText(link)
    setVoteLinkCopied(true)
    setTimeout(() => setVoteLinkCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/sessions" className="mt-1 text-muted hover:text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-display font-bold text-primary">{session.title}</h2>
            <Badge variant={isCompleted ? 'default' : session.status === 'ongoing' ? 'warning' : 'info'}>
              {isCompleted ? '✅ Completed' : session.status === 'ongoing' ? '🔴 Live' : '⏰ Upcoming'}
            </Badge>
          </div>
          <p className="text-sm text-muted mt-0.5">{formatDateTime(session.played_at)}</p>
          {session.location && <p className="text-xs text-muted">📍 {session.location}</p>}
          <p className="text-xs text-info">⏱ {session.duration_hours ?? 2}h session</p>
        </div>
        {isAdmin && !isCompleted && (
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>Delete</Button>
        )}
      </div>

      {/* Vote link card — always visible to admin while not completed */}
      {isAdmin && !isCompleted && session.vote_token && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-primary">🔗 Vote Link</h3>
              <p className="text-sm text-muted mt-0.5">
                {checkedIn.length > 0
                  ? `${checkedIn.length} member${checkedIn.length !== 1 ? 's' : ''} attending`
                  : 'Share so members can confirm attendance'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleCopyVoteLink} className="shrink-0">
              {voteLinkCopied ? '✓ Copied!' : 'Copy Link'}
            </Button>
          </div>
          <div className="mt-3 px-3 py-2 bg-surface-alt rounded-lg text-xs text-muted font-mono truncate">
            {window.location.origin}/vote/{session.vote_token}
          </div>
        </Card>
      )}

      {/* Check-in card */}
      {!isCompleted && (() => {
        const duration = session.duration_hours ?? 2
        const hoursOptions = getHoursOptions(duration)
        const effectiveHours = selfCheckInHours ?? duration
        return (
          <Card glow={!hasCheckedIn && session.status !== 'upcoming'}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-primary">Your Attendance</h3>
                <p className="text-sm text-muted mt-0.5">
                  {hasCheckedIn
                    ? `✅ Checked in · ${myAttendance?.hours_attended ?? duration}h`
                    : 'Select how long you\'ll attend'}
                </p>
              </div>
              {hasCheckedIn && <span className="text-accent text-2xl shrink-0">✓</span>}
            </div>

            {!hasCheckedIn && (
              <div className="mt-3 space-y-3">
                <div className={`grid gap-2 ${hoursOptions.length <= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {hoursOptions.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSelfCheckInHours(h)}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                        effectiveHours === h
                          ? 'bg-accent text-surface'
                          : 'bg-surface-alt border border-border text-muted hover:text-primary'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
                {effectiveHours < duration && (
                  <p className="text-xs text-warning">
                    ⚡ You'll be charged {Math.round((effectiveHours / duration) * 100)}% of the full fee
                  </p>
                )}
                <Button onClick={handleCheckIn} loading={checkIn.isPending} className="w-full animate-pulse-glow">
                  Check In · {effectiveHours}h
                </Button>
              </div>
            )}

            {isAdmin && (
              <div className="mt-3 pt-3 border-t border-border">
                <Button variant="secondary" size="sm" onClick={() => setShowCheckInFor(true)}>
                  Check in for someone
                </Button>
              </div>
            )}
          </Card>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance list */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Attendance ({checkedIn.length})</h3>
          </div>
          {(session.attendances ?? []).length === 0 ? (
            <p className="text-sm text-muted">No attendees yet</p>
          ) : (
            <div className="space-y-2">
              {(session.attendances ?? []).map(att => {
                const playerCustomFee = customExpenses
                  .filter(e => e.player_id === att.player_id)
                  .reduce((s, e) => s + e.amount, 0)
                const canRemove = isAdmin && !isCompleted && att.checked_in_at && !att.voted
                return (
                  <div key={att.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-card-hover flex items-center justify-center text-xs font-bold text-muted shrink-0">
                        {att.profile ? getInitials(att.profile.full_name) : '?'}
                      </div>
                      <span className="text-sm text-primary truncate">{att.profile?.full_name ?? att.player_id}</span>
                      {att.voted && att.checked_in_at && (
                        <span className="text-xs text-info shrink-0">voted</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {att.checked_in_at ? (
                        <span className="text-xs text-accent">
                          ✓ {att.hours_attended != null && att.hours_attended !== (session.duration_hours ?? 2)
                            ? `${att.hours_attended}h`
                            : 'In'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Absent</span>
                      )}
                      {isCompleted && att.fee_charged > 0 && (
                        <span className="text-xs text-danger">-{formatAUD(att.fee_charged)}</span>
                      )}
                      {!isCompleted && playerCustomFee > 0 && (
                        <span className="text-xs text-warning">+{formatAUD(playerCustomFee)} extra</span>
                      )}
                      {canRemove && (
                        <button
                          onClick={() => handleRemoveCheckIn(att.player_id)}
                          disabled={removeCheckIn.isPending}
                          className="text-xs text-danger hover:text-danger/70 transition-colors ml-1"
                          title="Remove check-in"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Expenses */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Expenses</h3>
            {isAdmin && !isCompleted && (
              <Button size="sm" variant="secondary" onClick={openExpenseModal}>+ Add</Button>
            )}
          </div>

          {(session.group_expenses ?? []).length === 0 ? (
            <p className="text-sm text-muted">No expenses logged</p>
          ) : (
            <div className="space-y-2">
              {sharedExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary">{CATEGORY_LABELS[exp.category as ExpenseCategory]}</p>
                    {exp.note && <p className="text-xs text-muted">{exp.note}</p>}
                    <p className="text-xs text-muted">Equal split</p>
                  </div>
                  <span className="text-sm font-semibold text-danger">{formatAUD(exp.amount)}</span>
                </div>
              ))}
              {customExpenses.map(exp => {
                const playerName = (session.attendances ?? []).find(a => a.player_id === exp.player_id)?.profile?.full_name
                return (
                  <div key={exp.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary">{CATEGORY_LABELS[exp.category as ExpenseCategory]}</p>
                      {exp.note && <p className="text-xs text-muted">{exp.note}</p>}
                      <p className="text-xs text-warning">{playerName ?? exp.player_id}</p>
                    </div>
                    <span className="text-sm font-semibold text-danger">{formatAUD(exp.amount)}</span>
                  </div>
                )
              })}
              <div className="border-t border-border pt-2 mt-2 space-y-1">
                {sharedExpenses.length > 0 && checkedIn.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Shared per player ({checkedIn.length} ppl)</span>
                    <span className="text-sm font-bold text-accent">{formatAUD(sharedCostPerPlayer)}</span>
                  </div>
                )}
                {customExpenses.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Custom fees total</span>
                    <span className="text-sm font-bold text-warning">{formatAUD(totalCustom)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Total</span>
                  <span className="font-semibold text-primary">{formatAUD(totalExpenses)}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Finalize */}
      {isAdmin && !isCompleted && checkedIn.length > 0 && (
        <Card className="border-accent/19">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-primary">Finalize Session</h3>
              <p className="text-sm text-muted mt-0.5">
                {totalExpenses === 0
                  ? 'No expenses logged yet'
                  : customExpenses.length > 0
                  ? `${formatAUD(sharedCostPerPlayer)} shared + custom fees for ${checkedIn.length} players`
                  : `Deduct ${formatAUD(sharedCostPerPlayer)} from each of ${checkedIn.length} players`}
              </p>
            </div>
            <Button onClick={handleFinalize} loading={finalizeLoading} disabled={totalExpenses === 0} className="shrink-0">
              Finalize
            </Button>
          </div>
        </Card>
      )}

      {/* Add expense modal */}
      <Modal open={showExpense} onClose={() => setShowExpense(false)} title="Add Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="flex gap-1 bg-surface-alt border border-border rounded-lg p-1">
            {(['equal', 'custom'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setExpenseForm(f => ({ ...f, splitType: t }))}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  expenseForm.splitType === t
                    ? 'bg-accent text-surface'
                    : 'text-muted hover:text-primary'
                }`}
              >
                {t === 'equal' ? '⚖️ Equal Split' : '✏️ Custom Split'}
              </button>
            ))}
          </div>

          <Select
            label="Category"
            value={expenseForm.category}
            onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
          >
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>

          {expenseForm.splitType === 'equal' ? (
            <Input
              label="Total Amount (AUD)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              prefix="$"
              value={expenseForm.amount}
              onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
              required
            />
          ) : (
            <div className="space-y-3">
              {/* Custom sub-mode toggle */}
              <div className="flex gap-1 bg-surface-alt border border-border rounded-lg p-1">
                {(['equal_selected', 'manual'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setExpenseForm(f => ({ ...f, customMode: m }))}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      expenseForm.customMode === m
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    {m === 'equal_selected' ? '⚖️ Equal split' : '✏️ Per player'}
                  </button>
                ))}
              </div>

              {checkedIn.length === 0 ? (
                <p className="text-xs text-muted">No checked-in players yet</p>
              ) : expenseForm.customMode === 'equal_selected' ? (
                <>
                  <Input
                    label="Total Amount (AUD)"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    prefix="$"
                    value={expenseForm.customTotal}
                    onChange={e => setExpenseForm(f => ({ ...f, customTotal: e.target.value }))}
                  />
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted font-medium uppercase tracking-wider">Split among</p>
                    {checkedIn.map(att => {
                      const selected = expenseForm.selectedPlayers.has(att.player_id)
                      const selectedCount = expenseForm.selectedPlayers.size
                      const total = parseFloat(expenseForm.customTotal) || 0
                      const share = selected && selectedCount > 0 ? Math.round((total / selectedCount) * 100) / 100 : null
                      return (
                        <button
                          key={att.player_id}
                          type="button"
                          onClick={() => setExpenseForm(f => {
                            const next = new Set(f.selectedPlayers)
                            next.has(att.player_id) ? next.delete(att.player_id) : next.add(att.player_id)
                            return { ...f, selectedPlayers: next }
                          })}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                            selected
                              ? 'border-accent/40 bg-accent/6 text-primary'
                              : 'border-border bg-surface-alt text-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              selected ? 'bg-accent border-accent' : 'border-border'
                            }`}>
                              {selected && <span className="text-surface text-[10px] font-bold">✓</span>}
                            </div>
                            <div className="w-6 h-6 rounded-full bg-card-hover flex items-center justify-center text-xs font-bold text-muted">
                              {att.profile ? getInitials(att.profile.full_name) : '?'}
                            </div>
                            <span className="text-sm">{att.profile?.full_name ?? att.player_id}</span>
                          </div>
                          {share !== null && (
                            <span className="text-xs font-semibold text-accent">{formatAUD(share)}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {expenseForm.selectedPlayers.size > 0 && parseFloat(expenseForm.customTotal) > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      <span className="text-xs text-muted">{expenseForm.selectedPlayers.size} player{expenseForm.selectedPlayers.size !== 1 ? 's' : ''} × {formatAUD(Math.round((parseFloat(expenseForm.customTotal) / expenseForm.selectedPlayers.size) * 100) / 100)}</span>
                      <span className="text-sm font-bold text-primary">{formatAUD(parseFloat(expenseForm.customTotal))}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-muted font-medium uppercase tracking-wider">Amount per player</p>
                  {checkedIn.map(att => (
                    <div key={att.player_id} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-card-hover flex items-center justify-center text-xs font-bold text-muted shrink-0">
                          {att.profile ? getInitials(att.profile.full_name) : '?'}
                        </div>
                        <span className="text-sm text-primary truncate">{att.profile?.full_name ?? att.player_id}</span>
                      </div>
                      <div className="w-28 shrink-0">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          prefix="$"
                          value={expenseForm.allocations[att.player_id] ?? ''}
                          onChange={e => setExpenseForm(f => ({
                            ...f,
                            allocations: { ...f.allocations, [att.player_id]: e.target.value },
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-xs text-muted">Total</span>
                    <span className="text-sm font-bold text-primary">
                      {formatAUD(
                        checkedIn.reduce((s, att) => s + (parseFloat(expenseForm.allocations[att.player_id] || '0') || 0), 0)
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <Input
            label="Note (optional)"
            placeholder="e.g. 6 shuttlecocks"
            value={expenseForm.note}
            onChange={e => setExpenseForm(f => ({ ...f, note: e.target.value }))}
          />
          {expenseError && <p className="text-xs text-danger">{expenseError}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowExpense(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={addExpense.isPending} className="flex-1">Add Expense</Button>
          </div>
        </form>
      </Modal>

      {/* Check in for member modal */}
      <Modal
        open={showCheckInFor}
        onClose={() => { setShowCheckInFor(false); setCheckInForTarget(null); setCheckInForHours(null) }}
        title={checkInForTarget ? checkInForTarget.name : 'Check In For Member'}
      >
        {!checkInForTarget ? (
          <div className="space-y-2">
            {notAttendingMembers.length === 0 ? (
              <p className="text-sm text-muted">All members are already checked in</p>
            ) : (
              notAttendingMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setCheckInForTarget({ id: m.id, name: m.full_name }); setCheckInForHours(null) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card-hover transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center text-xs font-bold text-muted shrink-0">
                    {getInitials(m.full_name)}
                  </div>
                  <span className="text-sm text-primary flex-1">{m.full_name}</span>
                  <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))
            )}
          </div>
        ) : (() => {
          const duration = session.duration_hours ?? 2
          const hoursOptions = getHoursOptions(duration)
          const effectiveHours = checkInForHours ?? duration
          return (
            <div className="space-y-4">
              <div className={`grid gap-2 ${hoursOptions.length <= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {hoursOptions.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setCheckInForHours(h)}
                    className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                      effectiveHours === h
                        ? 'bg-accent text-surface'
                        : 'bg-surface-alt border border-border text-muted hover:text-primary'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              {effectiveHours < duration && (
                <p className="text-xs text-warning">
                  ⚡ Charged {Math.round((effectiveHours / duration) * 100)}% of the full fee
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setCheckInForTarget(null)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => handleCheckInFor(checkInForTarget.id, effectiveHours)}
                  loading={checkIn.isPending}
                  className="flex-1"
                >
                  Check In · {effectiveHours}h
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Session">
        <p className="text-sm text-muted mb-4">
          Are you sure you want to delete <strong className="text-primary">{session.title}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowDelete(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteSession.isPending} className="flex-1">Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
