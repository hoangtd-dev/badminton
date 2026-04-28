import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers, getMemberStatus } from '@/hooks/useMembers'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatAUD, getInitials } from '@/lib/utils'

const STATUS_CONFIG = {
  ok: { variant: 'success' as const, label: 'Good' },
  low: { variant: 'warning' as const, label: 'Low' },
  empty: { variant: 'danger' as const, label: 'Empty' },
}

export default function MembersPage() {
  const { data: members, isLoading } = useMembers()
  const [search, setSearch] = useState('')

  const filtered = (members ?? []).filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.phone ?? '').includes(search)
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-display font-bold text-primary">Members</h2>
        <p className="text-sm text-muted mt-0.5">Manage group members and balances</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Total Members</p>
          <p className="text-2xl font-display font-bold text-primary">{members?.length ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Group Balance</p>
          <p className="text-2xl font-display font-bold text-info">
            {formatAUD((members ?? []).reduce((s, m) => s + m.balance, 0))}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Low Balance</p>
          <p className="text-2xl font-display font-bold text-warning">
            {(members ?? []).filter(m => getMemberStatus(m) !== 'ok').length}
          </p>
        </Card>
      </div>

      <input
        placeholder="Search by name or phone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent transition-colors"
      />

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-surface-alt rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-muted">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted px-5 py-3 uppercase tracking-wider">Member</th>
                  <th className="text-left text-xs font-medium text-muted px-5 py-3 uppercase tracking-wider">Phone</th>
                  <th className="text-left text-xs font-medium text-muted px-5 py-3 uppercase tracking-wider">Role</th>
                  <th className="text-right text-xs font-medium text-muted px-5 py-3 uppercase tracking-wider">Balance</th>
                  <th className="text-center text-xs font-medium text-muted px-5 py-3 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(member => {
                  const status = getMemberStatus(member)
                  const statusConf = STATUS_CONFIG[status]
                  return (
                    <tr key={member.id} className="hover:bg-card-hover transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-card-hover border border-border flex items-center justify-center text-xs font-bold text-muted shrink-0">
                            {getInitials(member.full_name)}
                          </div>
                          <span className="text-sm font-medium text-primary">{member.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted">{member.phone ?? '—'}</td>
                      <td className="px-5 py-3">
                        <Badge variant={member.role === 'admin' ? 'info' : 'default'}>
                          {member.role}
                        </Badge>
                      </td>
                      <td className={`px-5 py-3 text-sm font-semibold tabular-nums text-right ${
                        status === 'empty' ? 'text-danger' : status === 'low' ? 'text-warning' : 'text-accent'
                      }`}>
                        {formatAUD(member.balance)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/members/${member.id}`}>
                          <Button size="sm" variant="secondary">Manage</Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
