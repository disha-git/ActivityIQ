import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { get, run, newId } from './db.ts'

export const COOKIE_NAME = 'activityiq_sid'
const SESSION_DAYS = 30

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(candidate, 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export interface UserRow {
  id: string
  email: string
  password_hash: string
  name: string
  created_at: string
}

export interface EmployeeRow {
  id: string
  user_id: string | null
  name: string
  role: string
  initials: string
  color: string
  project_id: string
  status: 'online' | 'offline'
  created_at: string
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await run('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', [token, userId, expiresAt])
  return { token, expiresAt }
}

export async function destroySession(token: string): Promise<void> {
  await run('DELETE FROM sessions WHERE id = ?', [token])
}

async function resolveSessionUser(token: string | undefined): Promise<UserRow | null> {
  if (!token) return null
  const session = await get<{ id: string; user_id: string; expires_at: string }>(
    'SELECT * FROM sessions WHERE id = ?',
    [token],
  )
  if (!session) return null
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await destroySession(token)
    return null
  }
  const user = await get<UserRow>('SELECT * FROM users WHERE id = ?', [session.user_id])
  return user ?? null
}

export function getUserFromRequest(req: Request): Promise<UserRow | null> {
  return resolveSessionUser(req.cookies?.[COOKIE_NAME])
}

/** Same as getUserFromRequest but parses a raw `Cookie` header string — used by the
 * Socket.IO handshake, which isn't processed by the cookie-parser middleware. */
export function getUserFromRequestCookies(cookieHeader: string | undefined): Promise<UserRow | null> {
  if (!cookieHeader) return Promise.resolve(null)
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  return resolveSessionUser(match?.[1])
}

const AVATAR_COLORS = ['#21c17c', '#4b6fed', '#f5a623', '#e0578c', '#8b6cf5']

export async function ensureEmployeeForUser(user: UserRow): Promise<EmployeeRow> {
  const existing = await get<EmployeeRow>('SELECT * FROM employees WHERE user_id = ?', [user.id])
  if (existing) return existing

  const defaultProject = await get<{ id: string }>('SELECT id FROM projects ORDER BY id LIMIT 1')
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const employee: EmployeeRow = {
    id: newId('e'),
    user_id: user.id,
    name: user.name,
    role: 'Manager',
    initials: initials || 'U',
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    project_id: defaultProject!.id,
    status: 'offline',
    created_at: new Date().toISOString(),
  }

  await run(
    'INSERT INTO employees (id, user_id, name, role, initials, color, project_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      employee.id,
      employee.user_id,
      employee.name,
      employee.role,
      employee.initials,
      employee.color,
      employee.project_id,
      employee.status,
      employee.created_at,
    ],
  )

  return employee
}

export interface AuthedRequest extends Request {
  user?: UserRow
  employee?: EmployeeRow
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const user = await getUserFromRequest(req)
  if (!user) {
    res.status(401).json({ error: 'Not authenticated.' })
    return
  }
  req.user = user
  req.employee = await ensureEmployeeForUser(user)
  next()
}
