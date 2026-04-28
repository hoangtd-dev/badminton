import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  req.userId = user.id
  req.userRole = profile?.role ?? 'user'
  next()
}
