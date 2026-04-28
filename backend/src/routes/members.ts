import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

router.get('/', requireAuth, async (_req: AuthRequest, res) => {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('profiles').select('*').order('full_name')
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json(data)
})

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single()
  if (error || !data) {
    res.status(404).json({ error: 'Member not found' })
    return
  }
  res.json(data)
})

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params
  if (req.userRole !== 'admin' && req.userId !== id) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const supabase = getSupabase()
  // Only admins may change the low_balance_threshold
  const { low_balance_threshold, ...userUpdatableFields } = req.body
  const updates = req.userRole === 'admin'
    ? { ...userUpdatableFields, ...(low_balance_threshold !== undefined ? { low_balance_threshold } : {}) }
    : userUpdatableFields
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single()
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json(data)
})

export default router
