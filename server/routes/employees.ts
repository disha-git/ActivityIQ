import { Router } from 'express'
import { all, get, run, newId } from '../db.ts'
import { requireAuth, type AuthedRequest } from '../auth.ts'
import { listScreenshotsForEmployee } from '../services/screenshotService.ts'

const router = Router()

const MAX_PAGE_SIZE = 100
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** GET /api/employees/:id/screenshots — paginated history, optionally one day. */
router.get('/:id/screenshots', requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || 12))

  const rawDate = typeof req.query.date === 'string' ? req.query.date : ''
  if (rawDate && !DATE_PATTERN.test(rawDate)) {
    res.status(400).json({ error: 'date must be in YYYY-MM-DD format.' })
    return
  }

  const employee = await get('SELECT id FROM employees WHERE id = ?', [req.params.id])
  if (!employee) {
    res.status(404).json({ error: 'Unknown employee.' })
    return
  }

  res.json(await listScreenshotsForEmployee(req.params.id, page, limit, rawDate || null))
})

async function sumSeconds(employeeId: string, sinceIso: string): Promise<number> {
  const row = await get<{ total: number }>(
    'SELECT COALESCE(SUM(seconds), 0) as total FROM time_entries WHERE employee_id = ? AND started_at >= ?',
    [employeeId, sinceIso],
  )
  return Number(row?.total ?? 0)
}

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const employees = await all<{
    id: string
    user_id: string | null
    name: string
    role: string
    initials: string
    color: string
    project_id: string
    status: string
  }>('SELECT * FROM employees ORDER BY created_at')

  const enriched = await Promise.all(
    employees.map(async (emp) => ({
      ...emp,
      isYou: emp.user_id === req.user!.id,
      todaySeconds: await sumSeconds(emp.id, todayStart.toISOString()),
      weekSeconds: await sumSeconds(emp.id, weekStart.toISOString()),
      monthSeconds: await sumSeconds(emp.id, monthStart.toISOString()),
    })),
  )

  res.json({ employees: enriched })
})

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const { name, role, projectId } = req.body ?? {}
  if (!name || !projectId) {
    res.status(400).json({ error: 'Name and projectId are required.' })
    return
  }
  const project = await get('SELECT id FROM projects WHERE id = ?', [projectId])
  if (!project) {
    res.status(400).json({ error: 'Unknown projectId.' })
    return
  }

  const initials = String(name)
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const employee = {
    id: newId('e'),
    user_id: null,
    name,
    role: role || 'Team Member',
    initials: initials || 'NA',
    color: '#4b6fed',
    project_id: projectId,
    status: 'offline' as const,
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

  res.status(201).json({ employee })
})

export default router
