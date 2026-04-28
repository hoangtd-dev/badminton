import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Session, Attendance, GroupExpense, ExpenseCategory } from '@/types'

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<Session[]>('/api/sessions'),
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => api.get<Session>(`/api/sessions/${id}`),
    enabled: !!id,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (session: Omit<Session, 'id' | 'created_at' | 'created_by' | 'vote_token' | 'attendances' | 'group_expenses'>) =>
      api.post<Session>('/api/sessions', session),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useUpdateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Session> & { id: string }) =>
      api.put<Session>(`/api/sessions/${id}`, updates),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['session', vars.id] })
    },
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, playerId, hoursAttended }: { sessionId: string; playerId: string; hoursAttended?: number }) =>
      api.post<Attendance>(`/api/sessions/${sessionId}/checkin`, { playerId, hoursAttended }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['session', vars.sessionId] }),
  })
}

export function useGenerateVoteLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<Session>(`/api/sessions/${sessionId}/generate-vote`),
    onSuccess: (_data, sessionId) =>
      qc.invalidateQueries({ queryKey: ['session', sessionId] }),
  })
}

export function useRemoveCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, playerId }: { sessionId: string; playerId: string }) =>
      api.delete(`/api/sessions/${sessionId}/checkin/${playerId}`),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['session', vars.sessionId] }),
  })
}

export function useAddExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      session_id,
      split_type = 'equal',
      allocations,
      ...rest
    }: {
      session_id: string
      category: ExpenseCategory
      amount?: number
      note: string | null
      split_type?: 'equal' | 'custom'
      allocations?: { player_id: string; amount: number }[]
    }) =>
      api.post(`/api/sessions/${session_id}/expenses`, { ...rest, split_type, allocations }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['session', vars.session_id] }),
  })
}

export function useFinalizeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post(`/api/sessions/${sessionId}/finalize`),
    onSuccess: (_data, sessionId) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['session', sessionId] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['members'] })
    },
  })
}
