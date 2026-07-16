import { Router } from 'express'
import { z } from 'zod'
import { get, run, newId } from '../db.ts'
import {
  COOKIE_NAME,
  createSession,
  destroySession,
  ensureEmployeeForUser,
  getUserFromRequest,
  hashPassword,
  requireAuth,
  verifyPassword,
  type AuthedRequest,
  type UserRow,
} from '../auth.ts'
import { validateBody } from '../middleware/validate.ts'

const router = Router()

const credentialsSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  name: z.string().trim().max(120).optional(),
})
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, maxAge: 30 * 24 * 60 * 60 * 1000 }

async function setSessionCookie(res: import('express').Response, userId: string) {
  const { token } = await createSession(userId)
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS)
}

async function respondWithSession(res: import('express').Response, user: UserRow) {
  const employee = await ensureEmployeeForUser(user)
  await setSessionCookie(res, user.id)
  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    employee,
  })
}

router.post('/demo', async (_req, res) => {
  let user = await get<UserRow>('SELECT * FROM users WHERE email = ?', ['demo@activityiq.io'])
  if (!user) {
    user = {
      id: newId('u'),
      email: 'demo@activityiq.io',
      password_hash: hashPassword(newId('pw')),
      name: 'Demo Manager',
      created_at: new Date().toISOString(),
    }
    await run('INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)', [
      user.id,
      user.email,
      user.password_hash,
      user.name,
      user.created_at,
    ])
  }
  await respondWithSession(res, user)
})

router.post('/signup', validateBody(credentialsSchema), async (req, res) => {
  const { email, password, name } = req.body as z.infer<typeof credentialsSchema>
  const existing = await get('SELECT id FROM users WHERE email = ?', [email])
  if (existing) {
    res.status(409).json({ error: 'An account with that email already exists. Try logging in instead.' })
    return
  }

  const user: UserRow = {
    id: newId('u'),
    email,
    password_hash: hashPassword(password),
    name: name || email.split('@')[0],
    created_at: new Date().toISOString(),
  }
  await run('INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)', [
    user.id,
    user.email,
    user.password_hash,
    user.name,
    user.created_at,
  ])

  await respondWithSession(res, user)
})

router.post('/login', validateBody(credentialsSchema.omit({ name: true })), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof credentialsSchema>
  let user = await get<UserRow>('SELECT * FROM users WHERE email = ?', [email])

  if (!user) {
    user = {
      id: newId('u'),
      email,
      password_hash: hashPassword(password),
      name: email.split('@')[0],
      created_at: new Date().toISOString(),
    }
    await run('INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)', [
      user.id,
      user.email,
      user.password_hash,
      user.name,
      user.created_at,
    ])
  } else if (!verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Incorrect password.' })
    return
  }

  await respondWithSession(res, user)
})

router.post('/logout', async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME]
  if (token) await destroySession(token)
  res.clearCookie(COOKIE_NAME)
  res.json({ ok: true })
})

router.get('/me', async (req, res) => {
  const user = await getUserFromRequest(req)
  if (!user) {
    res.status(401).json({ error: 'Not authenticated.' })
    return
  }
  const employee = await ensureEmployeeForUser(user)
  res.json({ user: { id: user.id, email: user.email, name: user.name }, employee })
})

function generatePairingCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

/** Generates a short-lived code the desktop agent exchanges for a JWT via POST /api/agent/pair. */
router.post('/agent-pairing-code', requireAuth, async (req: AuthedRequest, res) => {
  const code = generatePairingCode()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000)

  await run('INSERT INTO agent_pairing_codes (code, employee_id, created_at, expires_at, used) VALUES (?, ?, ?, ?, 0)', [
    code,
    req.employee!.id,
    now.toISOString(),
    expiresAt.toISOString(),
  ])

  res.status(201).json({ code, expiresAt: expiresAt.toISOString() })
})

export default router
