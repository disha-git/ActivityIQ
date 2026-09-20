import type { Response, NextFunction } from 'express'
import { getUserFromRequest, ensureEmployeeForUser, type AuthedRequest } from '../auth.ts'

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const user = req.user || (await getUserFromRequest(req))
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' })
    return
  }

  req.user = user
  req.employee = await ensureEmployeeForUser(user)

  const adminEmail = process.env.ADMIN_EMAIL
  const isAdmin = user.is_admin === 1 || (Boolean(adminEmail) && user.email === adminEmail)
  if (!isAdmin) {
    res.status(403).json({ error: 'Admin privileges required.' })
    return
  }

  next()
}
