import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { requireAdmin } from '../middleware/requireAdmin'
import { applyTopUp, applyWithdraw } from '../services/balanceService'

const router = Router()

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const supabase = getSupabase()
  let query = supabase
    .from('transactions')
    .select('*, profile:profiles!player_id(full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(100)

  const playerId = req.userRole === 'admin'
    ? (req.query.playerId as string | undefined)
    : req.userId
  if (playerId) query = query.eq('player_id', playerId)

  const { data, error } = await query
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json(data)
})

const VALID_TRANSACTION_TYPES = ['topup', 'court_fee', 'shuttlecock', 'water', 'other'] as const
type TransactionType = typeof VALID_TRANSACTION_TYPES[number]

router.post('/topup', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { playerId, amount, type, description } = req.body
  const txType: TransactionType = VALID_TRANSACTION_TYPES.includes(type) ? type : 'topup'

  if (!playerId || !amount || amount <= 0) {
    res.status(400).json({ error: 'playerId and positive amount are required' })
    return
  }

  try {
    const supabase = getSupabase()
    await applyTopUp(supabase, playerId, parseFloat(amount), txType, description || 'Manual top-up', req.userId!)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/withdraw', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { playerId, amount, description } = req.body

  if (!playerId || !amount || amount <= 0) {
    res.status(400).json({ error: 'playerId and positive amount are required' })
    return
  }

  try {
    const supabase = getSupabase()
    await applyWithdraw(supabase, playerId, parseFloat(amount), description || 'Manual withdrawal', req.userId!)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
