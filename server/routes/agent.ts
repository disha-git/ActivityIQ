import { Router } from 'express'
import { z } from 'zod'
import { all, get, run } from '../db.ts'
import { signAgentToken } from '../jwt.ts'
import { requireAgentAuth, type AgentAuthedRequest } from '../middleware/requireAgentAuth.ts'
import { validateBody } from '../middleware/validate.ts'
import { startTracking, stopTracking, appendActivitySample } from '../services/trackingService.ts'

const router = Router()

const pairSchema = z.object({ code: z.string().min(4).max(64) })

router.post('/pair', validateBody(pairSchema), async (req, res) => {
  const { code } = req.body as z.infer<typeof pairSchema>

  const row = await get<{ code: string; employee_id: string; expires_at: string; used: number }>(
    'SELECT * FROM agent_pairing_codes WHERE code = ?',
    [code],
  )

  if (!row || row.used) {
    res.status(400).json({ error: 'Invalid or already-used pairing code.' })
    return
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    res.status(400).json({ error: 'Pairing code has expired. Generate a new one from Settings.' })
    return
  }

  await run('UPDATE agent_pairing_codes SET used = 1 WHERE code = ?', [code])

  const employee = await get('SELECT * FROM employees WHERE id = ?', [row.employee_id])
  const token = signAgentToken(row.employee_id)

  res.json({ token, employee })
})

router.post('/heartbeat', requireAgentAuth, (req: AgentAuthedRequest, res) => {
  res.json({ ok: true, serverTime: new Date().toISOString(), employee: req.employee })
})

router.get('/projects', requireAgentAuth, async (_req, res) => {
  const projects = await all('SELECT * FROM projects ORDER BY name')
  res.json({ projects })
})

const startSchema = z.object({ projectId: z.string().min(1), note: z.string().max(500).optional().default('') })

router.post('/tracking/start', requireAgentAuth, validateBody(startSchema), async (req: AgentAuthedRequest, res) => {
  const { projectId, note } = req.body as z.infer<typeof startSchema>
  const result = await startTracking(req.employee!.id, projectId, note)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.status(201).json({ entry: result.data })
})

const stopSchema = z.object({ entryId: z.string().min(1) })

router.post('/tracking/stop', requireAgentAuth, validateBody(stopSchema), async (req: AgentAuthedRequest, res) => {
  const { entryId } = req.body as z.infer<typeof stopSchema>
  const result = await stopTracking(req.employee!.id, entryId)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json({ entry: result.data })
})

const activitySchema = z.object({
  entryId: z.string().min(1),
  projectId: z.string().min(1),
  app: z.string().min(1).max(120),
  url: z.string().max(300).default(''),
  activity: z.number().min(0).max(100),
  durationMinutes: z.number().min(1).max(120),
  idleSeconds: z.number().min(0).optional(),
})

router.post('/activity', requireAgentAuth, validateBody(activitySchema), async (req: AgentAuthedRequest, res) => {
  const { entryId, projectId, app, url, activity, durationMinutes } = req.body as z.infer<typeof activitySchema>
  await appendActivitySample(
    entryId,
    req.employee!.id,
    projectId,
    app,
    url,
    Math.round(activity),
    Math.round(durationMinutes),
  )
  res.status(201).json({ ok: true })
})

// Screenshot upload moved to POST /api/screenshots (see routes/screenshots.ts).
// It takes multipart/form-data and stores the bytes in MySQL as a LONGBLOB
// rather than writing a JPEG to disk and recording its path.

export default router
