import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Profile } from '@/types'

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => api.get<Profile[]>('/api/members'),
  })
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: () => api.get<Profile>(`/api/members/${id}`),
    enabled: !!id,
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
      return api.put<Profile>(`/api/members/${id}`, updates)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['members'] })
      qc.invalidateQueries({ queryKey: ['member', vars.id] })
    },
  })
}

export function getMemberStatus(profile: Profile): 'ok' | 'low' | 'empty' {
  if (profile.balance <= 0) return 'empty'
  if (profile.balance < profile.low_balance_threshold) return 'low'
  return 'ok'
}
