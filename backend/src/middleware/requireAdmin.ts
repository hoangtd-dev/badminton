import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}
