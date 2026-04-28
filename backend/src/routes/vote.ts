import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET /api/vote/:token — public, returns session info + member list
router.get('/:token', async (req, res) => {
  const supabase = getSupabase()
  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, title, played_at, location, status, vote_token, duration_hours, attendances(player_id, checked_in_at, hours_attended)')
    .eq('vote_token', req.params.token)
    .single()

  if (error || !session) {
    res.status(404).json({ error: 'Vote link not found or expired' })
    return
  }

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  res.json({ session, members: members ?? [] })
})

// POST /api/vote/:token — public, register attendance
router.post('/:token', async (req, res) => {
  const { memberId } = req.body
  if (!memberId) {
    res.status(400).json({ error: 'memberId is required' })
    return
  }

  const supabase = getSupabase()
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('vote_token', req.params.token)
    .single()

  if (sessionErr || !session) {
    res.status(404).json({ error: 'Vote link not found' })
    return
  }

  if (session.status === 'completed') {
    res.status(400).json({ error: 'Session is already completed' })
    return
  }

  const { hoursAttended } = req.body

  const { data, error } = await supabase
    .from('attendances')
    .upsert({
      session_id: session.id,
      player_id: memberId,
      checked_in_at: new Date().toISOString(),
      voted: true,
      ...(hoursAttended !== undefined ? { hours_attended: hoursAttended } : {}),
    })
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

export default router
