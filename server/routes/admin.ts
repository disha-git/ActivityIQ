import { Router } from 'express'
import { z } from 'zod'
import { all, get, run, newId } from '../db.ts'
import { requireAdmin } from '../middleware/requireAdmin.ts'
import { getRangeBounds, rangeLabel } from '../lib/dateRange.ts'
import { computeFocusScore } from '../services/ai/focusScore.ts'
import { heuristicProvider } from '../services/ai/heuristicProvider.ts'
import { hashPassword } from '../auth.ts'

const router = Router()

// Protect all /api/admin routes with requireAdmin middleware
router.use(requireAdmin)

/**
 * GET /api/admin/overview
 * System-wide metrics, active users, hours logged, charts, and recent activity.
 */
router.get('/overview', async (_req, res) => {
  try {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Total employees & projects
    const totalEmployeesRow = await get<{ count: number }>('SELECT COUNT(*) as count FROM employees')
    const totalProjectsRow = await get<{ count: number }>('SELECT COUNT(*) as count FROM projects')

    // Currently active / online employees
    const activeTrackingRow = await get<{ count: number }>(
      'SELECT COUNT(DISTINCT employee_id) as count FROM time_entries WHERE ended_at IS NULL',
    )
    const onlineEmployeesRow = await get<{ count: number }>(
      "SELECT COUNT(*) as count FROM employees WHERE status = 'online'",
    )

    // Tracked seconds
    const todaySecondsRow = await get<{ total: number }>(
      'SELECT COALESCE(SUM(seconds), 0) as total FROM time_entries WHERE started_at >= ?',
      [todayStart.toISOString()],
    )
    const weekSecondsRow = await get<{ total: number }>(
      'SELECT COALESCE(SUM(seconds), 0) as total FROM time_entries WHERE started_at >= ?',
      [weekStart.toISOString()],
    )
    const monthSecondsRow = await get<{ total: number }>(
      'SELECT COALESCE(SUM(seconds), 0) as total FROM time_entries WHERE started_at >= ?',
      [monthStart.toISOString()],
    )

    // Average focus score across all activity samples today
    const avgActivityRow = await get<{ avg_act: number }>(
      'SELECT COALESCE(AVG(activity), 82) as avg_act FROM activity_samples WHERE sampled_at >= ?',
      [todayStart.toISOString()],
    )
    const avgFocusScore = Math.round(Number(avgActivityRow?.avg_act ?? 82))

    // Estimated idle time minutes (samples with activity < 40)
    const idleSamplesRow = await get<{ idle_mins: number }>(
      'SELECT COALESCE(SUM(duration_minutes), 0) as idle_mins FROM activity_samples WHERE activity < 40 AND sampled_at >= ?',
      [todayStart.toISOString()],
    )

    // Daily hours trend for last 7 days
    const dailyTrend: { date: string; label: string; hours: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dStart = new Date(d.setHours(0, 0, 0, 0))
      const dEnd = new Date(d.setHours(23, 59, 59, 999))
      const daySecondsRow = await get<{ total: number }>(
        'SELECT COALESCE(SUM(seconds), 0) as total FROM time_entries WHERE started_at >= ? AND started_at <= ?',
        [dStart.toISOString(), dEnd.toISOString()],
      )
      const label = dStart.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
      dailyTrend.push({
        date: dStart.toISOString().slice(0, 10),
        label,
        hours: Number((Number(daySecondsRow?.total ?? 0) / 3600).toFixed(1)),
      })
    }

    // Project distribution
    const projects = await all<{ id: string; name: string; color: string }>('SELECT * FROM projects')
    const projectDist = await Promise.all(
      projects.map(async (p) => {
        const secRow = await get<{ total: number }>(
          'SELECT COALESCE(SUM(seconds), 0) as total FROM time_entries WHERE project_id = ? AND started_at >= ?',
          [p.id, monthStart.toISOString()],
        )
        const empCountRow = await get<{ count: number }>(
          'SELECT COUNT(*) as count FROM employees WHERE project_id = ?',
          [p.id],
        )
        return {
          id: p.id,
          name: p.name,
          color: p.color,
          hours: Number((Number(secRow?.total ?? 0) / 3600).toFixed(1)),
          employeeCount: empCountRow?.count ?? 0,
        }
      }),
    )

    // Recent activity samples feed
    const recentActivity = await all<{
      id: string
      employee_id: string
      app: string
      url: string
      activity: number
      sampled_at: string
    }>('SELECT * FROM activity_samples ORDER BY sampled_at DESC LIMIT 10')

    const employeesMap = new Map(
      (await all<{ id: string; name: string; initials: string; color: string }>('SELECT id, name, initials, color FROM employees')).map((e) => [e.id, e]),
    )

    const recentFeed = recentActivity.map((act) => {
      const emp = employeesMap.get(act.employee_id)
      return {
        id: act.id,
        employeeName: emp?.name ?? 'Unknown',
        employeeInitials: emp?.initials ?? 'NA',
        employeeColor: emp?.color ?? '#4b6fed',
        app: act.app,
        url: act.url,
        activity: act.activity,
        timestamp: act.sampled_at,
      }
    })

    res.json({
      metrics: {
        totalEmployees: totalEmployeesRow?.count ?? 0,
        activeTrackingCount: activeTrackingRow?.count ?? 0,
        onlineEmployeesCount: onlineEmployeesRow?.count ?? 0,
        totalProjects: totalProjectsRow?.count ?? 0,
        todayHours: Number((Number(todaySecondsRow?.total ?? 0) / 3600).toFixed(1)),
        weekHours: Number((Number(weekSecondsRow?.total ?? 0) / 3600).toFixed(1)),
        monthHours: Number((Number(monthSecondsRow?.total ?? 0) / 3600).toFixed(1)),
        avgFocusScore,
        idleTimeMinutes: idleSamplesRow?.idle_mins ?? 0,
      },
      dailyTrend,
      projectDistribution: projectDist,
      recentFeed,
    })
  } catch (err) {
    console.error('Error fetching admin overview:', err)
    res.status(500).json({ error: 'Failed to fetch admin overview metrics.' })
  }
})

/**
 * GET /api/admin/employees
 * List all employees with search, status/project/role filters, sorting, and pagination.
 */
router.get('/employees', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10))
    const offset = (page - 1) * limit

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const status = typeof req.query.status === 'string' ? req.query.status : 'all'
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : 'all'
    const role = typeof req.query.role === 'string' ? req.query.role : 'all'
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name'
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC'

    let whereClause = 'WHERE 1=1'
    const params: unknown[] = []

    if (search) {
      whereClause += ' AND (e.name LIKE ? OR e.role LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    if (status !== 'all') {
      whereClause += ' AND e.status = ?'
      params.push(status)
    }
    if (projectId !== 'all') {
      whereClause += ' AND e.project_id = ?'
      params.push(projectId)
    }
    if (role !== 'all') {
      whereClause += ' AND e.role = ?'
      params.push(role)
    }

    let orderBy = 'ORDER BY e.name ASC'
    if (sortBy === 'created_at') orderBy = `ORDER BY e.created_at ${sortOrder}`
    else if (sortBy === 'role') orderBy = `ORDER BY e.role ${sortOrder}`
    else if (sortBy === 'status') orderBy = `ORDER BY e.status ${sortOrder}`
    else orderBy = `ORDER BY e.name ${sortOrder}`

    const countRow = await get<{ total: number }>(`SELECT COUNT(*) as total FROM employees e ${whereClause}`, params)
    const total = countRow?.total ?? 0

    const query = `
      SELECT e.*, p.name as project_name, u.email as user_email, u.is_admin
      FROM employees e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN users u ON e.user_id = u.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `

    const employees = await all<{
      id: string
      user_id: string | null
      name: string
      role: string
      initials: string
      color: string
      project_id: string
      status: string
      created_at: string
      project_name: string | null
      user_email: string | null
      is_admin: number | null
    }>(query, [...params, limit, offset])

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const todaySec = await get<{ total: number }>(
          'SELECT COALESCE(SUM(seconds), 0) as total FROM time_entries WHERE employee_id = ? AND started_at >= ?',
          [emp.id, todayStart.toISOString()],
        )
        const weekSec = await get<{ total: number }>(
          'SELECT COALESCE(SUM(seconds), 0) as total FROM time_entries WHERE employee_id = ? AND started_at >= ?',
          [emp.id, weekStart.toISOString()],
        )
        const activeEntry = await get<{ id: string }>(
          'SELECT id FROM time_entries WHERE employee_id = ? AND ended_at IS NULL',
          [emp.id],
        )

        const focusResult = await computeFocusScore(emp.id, todayStart, now)

        return {
          ...emp,
          projectName: emp.project_name ?? 'Unassigned',
          userEmail: emp.user_email ?? 'No User Account',
          isAdmin: emp.is_admin === 1 || (Boolean(process.env.ADMIN_EMAIL) && emp.user_email === process.env.ADMIN_EMAIL),
          isTrackingNow: !!activeEntry,
          todayHours: Number((Number(todaySec?.total ?? 0) / 3600).toFixed(1)),
          weekHours: Number((Number(weekSec?.total ?? 0) / 3600).toFixed(1)),
          focusScore: focusResult.score,
        }
      }),
    )

    res.json({
      employees: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (err) {
    console.error('Error fetching admin employees list:', err)
    res.status(500).json({ error: 'Failed to fetch employees list.' })
  }
})

/**
 * POST /api/admin/employees
 * Create a new employee and optional user login credentials.
 */
router.post('/employees', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().trim().min(2, 'Name is required'),
      role: z.string().trim().min(2, 'Role is required'),
      projectId: z.string().min(1, 'Project is required'),
      email: z.string().trim().email('Valid email is required').optional().or(z.literal('')),
      password: z.string().min(6, 'Password must be at least 6 chars').optional().or(z.literal('')),
      isAdmin: z.boolean().optional(),
    })

    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input data.' })
      return
    }

    const { name, role, projectId, email, password, isAdmin } = parsed.data

    const project = await get('SELECT id FROM projects WHERE id = ?', [projectId])
    if (!project) {
      res.status(400).json({ error: 'Selected project does not exist.' })
      return
    }

    let userId: string | null = null
    if (email && password) {
      const existingUser = await get('SELECT id FROM users WHERE email = ?', [email])
      if (existingUser) {
        res.status(409).json({ error: 'A user account with this email already exists.' })
        return
      }

      userId = newId('u')
      const adminFlag = isAdmin || (Boolean(process.env.ADMIN_EMAIL) && email === process.env.ADMIN_EMAIL) ? 1 : 0
      await run(
        'INSERT INTO users (id, email, password_hash, name, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, email, hashPassword(password), name, adminFlag, new Date().toISOString()],
      )
    }

    const initials = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    const AVATAR_COLORS = ['#21c17c', '#4b6fed', '#f5a623', '#e0578c', '#8b6cf5']
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]

    const empId = newId('e')
    const createdAt = new Date().toISOString()

    await run(
      'INSERT INTO employees (id, user_id, name, role, initials, color, project_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [empId, userId, name, role, initials, color, projectId, 'offline', createdAt],
    )

    const createdEmp = await get('SELECT * FROM employees WHERE id = ?', [empId])
    res.status(201).json({ employee: createdEmp })
  } catch (err) {
    console.error('Error creating employee:', err)
    res.status(500).json({ error: 'Failed to create employee.' })
  }
})

/**
 * PUT /api/admin/employees/:id
 * Update an existing employee.
 */
router.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params
    const existing = await get<{ id: string; user_id: string | null }>('SELECT id, user_id FROM employees WHERE id = ?', [id])
    if (!existing) {
      res.status(404).json({ error: 'Employee not found.' })
      return
    }

    const { name, role, projectId, status, isAdmin } = req.body ?? {}
    if (!name || !role || !projectId) {
      res.status(400).json({ error: 'Name, role, and projectId are required.' })
      return
    }

    const initials = String(name)
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    await run('UPDATE employees SET name = ?, role = ?, initials = ?, project_id = ?, status = ? WHERE id = ?', [
      name,
      role,
      initials,
      projectId,
      status || 'offline',
      id,
    ])

    if (existing.user_id && typeof isAdmin === 'boolean') {
      await run('UPDATE users SET is_admin = ? WHERE id = ?', [isAdmin ? 1 : 0, existing.user_id])
    }

    const updated = await get('SELECT * FROM employees WHERE id = ?', [id])
    res.json({ employee: updated })
  } catch (err) {
    console.error('Error updating employee:', err)
    res.status(500).json({ error: 'Failed to update employee.' })
  }
})

/**
 * DELETE /api/admin/employees/:id
 */
router.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params
    const existing = await get<{ id: string; user_id: string | null }>('SELECT id, user_id FROM employees WHERE id = ?', [id])
    if (!existing) {
      res.status(404).json({ error: 'Employee not found.' })
      return
    }

    // Clean up associated time entries, activity samples, screenshots, ai_insights
    await run('DELETE FROM activity_samples WHERE employee_id = ?', [id])
    await run('DELETE FROM screenshots WHERE employee_id = ?', [id])
    await run('DELETE FROM time_entries WHERE employee_id = ?', [id])
    await run('DELETE FROM ai_insights WHERE employee_id = ?', [id])
    await run('DELETE FROM employees WHERE id = ?', [id])

    if (existing.user_id) {
      await run('DELETE FROM sessions WHERE user_id = ?', [existing.user_id])
      await run('DELETE FROM users WHERE id = ?', [existing.user_id])
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Error deleting employee:', err)
    res.status(500).json({ error: 'Failed to delete employee.' })
  }
})

/**
 * GET /api/admin/employees/:id/detail
 * Complete deep breakdown of single employee.
 */
router.get('/employees/:id/detail', async (req, res) => {
  try {
    const { id } = req.params
    const employee = await get<{
      id: string
      user_id: string | null
      name: string
      role: string
      initials: string
      color: string
      project_id: string
      status: string
      created_at: string
    }>('SELECT * FROM employees WHERE id = ?', [id])

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' })
      return
    }

    const project = await get<{ name: string; color: string }>('SELECT name, color FROM projects WHERE id = ?', [
      employee.project_id,
    ])
    const user = employee.user_id
      ? await get<{ email: string; is_admin: number }>('SELECT email, is_admin FROM users WHERE id = ?', [
          employee.user_id,
        ])
      : null

    const timeEntries = await all<{
      id: string
      project_id: string
      note: string
      started_at: string
      ended_at: string | null
      seconds: number
    }>('SELECT * FROM time_entries WHERE employee_id = ? ORDER BY started_at DESC LIMIT 50', [id])

    // Top apps and websites
    const topApps = await all<{ app: string; minutes: number }>(
      'SELECT app, SUM(duration_minutes) as minutes FROM activity_samples WHERE employee_id = ? GROUP BY app ORDER BY minutes DESC LIMIT 10',
      [id],
    )
    const topUrls = await all<{ url: string; minutes: number }>(
      'SELECT url, SUM(duration_minutes) as minutes FROM activity_samples WHERE employee_id = ? GROUP BY url ORDER BY minutes DESC LIMIT 10',
      [id],
    )

    // Recent screenshots (without LONGBLOB bytes)
    const screenshots = await all<{
      id: string
      captured_at: string
      active_window: string | null
      productivity_score: number | null
      ai_summary: string | null
    }>(
      'SELECT id, captured_at, active_window, productivity_score, ai_summary FROM screenshots WHERE employee_id = ? ORDER BY captured_at DESC LIMIT 12',
      [id],
    )

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const focusResult = await computeFocusScore(id, todayStart, now)

    res.json({
      employee: {
        ...employee,
        projectName: project?.name ?? 'Unassigned',
        projectColor: project?.color ?? '#4b6fed',
        userEmail: user?.email ?? null,
        isAdmin: user?.is_admin === 1 || (Boolean(process.env.ADMIN_EMAIL) && user?.email === process.env.ADMIN_EMAIL),
      },
      focusScore: focusResult,
      timeEntries,
      topApps,
      topUrls,
      screenshots: screenshots.map((s) => ({
        id: s.id,
        capturedAt: s.captured_at,
        activeWindow: s.active_window,
        productivityScore: s.productivity_score,
        aiSummary: s.ai_summary,
        imageUrl: `/api/screenshots/${s.id}`,
      })),
    })
  } catch (err) {
    console.error('Error fetching employee detail:', err)
    res.status(500).json({ error: 'Failed to fetch employee details.' })
  }
})

/**
 * GET /api/admin/projects
 * List all projects with member counts and hours tracked.
 */
router.get('/projects', async (_req, res) => {
  try {
    const projects = await all<{ id: string; name: string; color: string }>('SELECT * FROM projects ORDER BY name ASC')

    const enriched = await Promise.all(
      projects.map(async (p) => {
        const empCount = await get<{ count: number }>('SELECT COUNT(*) as count FROM employees WHERE project_id = ?', [
          p.id,
        ])
        const totalSec = await get<{ total: number }>(
          'SELECT COALESCE(SUM(seconds), 0) as total FROM time_entries WHERE project_id = ?',
          [p.id],
        )

        return {
          ...p,
          employeeCount: empCount?.count ?? 0,
          totalHours: Number((Number(totalSec?.total ?? 0) / 3600).toFixed(1)),
        }
      }),
    )

    res.json({ projects: enriched })
  } catch (err) {
    console.error('Error fetching admin projects:', err)
    res.status(500).json({ error: 'Failed to fetch projects.' })
  }
})

/**
 * POST /api/admin/projects
 */
router.post('/projects', async (req, res) => {
  try {
    const { name, color } = req.body ?? {}
    if (!name) {
      res.status(400).json({ error: 'Project name is required.' })
      return
    }
    const id = newId('p')
    const projColor = color || '#4b6fed'
    await run('INSERT INTO projects (id, name, color) VALUES (?, ?, ?)', [id, name, projColor])

    res.status(201).json({ project: { id, name, color: projColor, employeeCount: 0, totalHours: 0 } })
  } catch (err) {
    console.error('Error creating project:', err)
    res.status(500).json({ error: 'Failed to create project.' })
  }
})

/**
 * PUT /api/admin/projects/:id
 */
router.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, color } = req.body ?? {}
    if (!name) {
      res.status(400).json({ error: 'Project name is required.' })
      return
    }

    await run('UPDATE projects SET name = ?, color = ? WHERE id = ?', [name, color || '#4b6fed', id])
    const updated = await get('SELECT * FROM projects WHERE id = ?', [id])
    res.json({ project: updated })
  } catch (err) {
    console.error('Error updating project:', err)
    res.status(500).json({ error: 'Failed to update project.' })
  }
})

/**
 * DELETE /api/admin/projects/:id
 */
router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    const empCount = await get<{ count: number }>('SELECT COUNT(*) as count FROM employees WHERE project_id = ?', [id])
    if (empCount && empCount.count > 0) {
      res.status(400).json({
        error: `Cannot delete project because it has ${empCount.count} assigned employee(s). Reassign them first.`,
      })
      return
    }

    await run('DELETE FROM projects WHERE id = ?', [id])
    res.json({ ok: true })
  } catch (err) {
    console.error('Error deleting project:', err)
    res.status(500).json({ error: 'Failed to delete project.' })
  }
})

/**
 * GET /api/admin/realtime
 * Active employee tracking sessions right now.
 */
router.get('/realtime', async (_req, res) => {
  try {
    const activeEntries = await all<{
      id: string
      employee_id: string
      project_id: string
      note: string
      started_at: string
    }>('SELECT * FROM time_entries WHERE ended_at IS NULL ORDER BY started_at DESC')

    const enriched = await Promise.all(
      activeEntries.map(async (entry) => {
        const emp = await get<{ name: string; initials: string; color: string; role: string }>(
          'SELECT name, initials, color, role FROM employees WHERE id = ?',
          [entry.employee_id],
        )
        const proj = await get<{ name: string }>('SELECT name FROM projects WHERE id = ?', [entry.project_id])

        // Get latest activity sample
        const lastSample = await get<{ app: string; url: string; activity: number }>(
          'SELECT app, url, activity FROM activity_samples WHERE entry_id = ? ORDER BY sampled_at DESC LIMIT 1',
          [entry.id],
        )

        // Get latest screenshot timestamp
        const lastShot = await get<{ captured_at: string }>(
          'SELECT captured_at FROM screenshots WHERE employee_id = ? ORDER BY captured_at DESC LIMIT 1',
          [entry.employee_id],
        )

        const liveSeconds = Math.round((Date.now() - new Date(entry.started_at).getTime()) / 1000)

        return {
          entryId: entry.id,
          employeeId: entry.employee_id,
          employeeName: emp?.name ?? 'Unknown',
          employeeInitials: emp?.initials ?? 'NA',
          employeeColor: emp?.color ?? '#4b6fed',
          employeeRole: emp?.role ?? 'Team Member',
          projectName: proj?.name ?? 'Unassigned',
          note: entry.note,
          startedAt: entry.started_at,
          liveSeconds,
          currentApp: lastSample?.app ?? 'Active Session',
          currentUrl: lastSample?.url ?? '',
          currentActivityScore: lastSample?.activity ?? 85,
          lastScreenshotAt: lastShot?.captured_at ?? null,
        }
      }),
    )

    res.json({ activeSessions: enriched })
  } catch (err) {
    console.error('Error fetching admin realtime monitoring:', err)
    res.status(500).json({ error: 'Failed to fetch live monitoring feed.' })
  }
})

/**
 * GET /api/admin/screenshots
 * System screenshot monitoring feed with filters and search.
 */
router.get('/screenshots', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12))
    const offset = (page - 1) * limit

    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : 'all'
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : 'all'
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const scoreTier = typeof req.query.scoreTier === 'string' ? req.query.scoreTier : 'all'

    let whereClause = 'WHERE 1=1'
    const params: unknown[] = []

    if (employeeId !== 'all') {
      whereClause += ' AND s.employee_id = ?'
      params.push(employeeId)
    }
    if (projectId !== 'all') {
      whereClause += ' AND e.project_id = ?'
      params.push(projectId)
    }
    if (search) {
      whereClause += ' AND (s.active_window LIKE ? OR s.ocr_text LIKE ? OR s.ai_summary LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (scoreTier === 'low') {
      whereClause += ' AND s.productivity_score < 50'
    } else if (scoreTier === 'med') {
      whereClause += ' AND s.productivity_score >= 50 AND s.productivity_score < 80'
    } else if (scoreTier === 'high') {
      whereClause += ' AND s.productivity_score >= 80'
    }

    const countRow = await get<{ total: number }>(
      `SELECT COUNT(*) as total FROM screenshots s LEFT JOIN employees e ON s.employee_id = e.id ${whereClause}`,
      params,
    )
    const total = countRow?.total ?? 0

    const query = `
      SELECT s.id, s.entry_id, s.employee_id, s.captured_at, s.active_window, s.ai_summary, s.productivity_score, s.ocr_text,
             e.name as employee_name, e.initials as employee_initials, e.color as employee_color, p.name as project_name
      FROM screenshots s
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN projects p ON e.project_id = p.id
      ${whereClause}
      ORDER BY s.captured_at DESC
      LIMIT ? OFFSET ?
    `

    const screenshots = await all<{
      id: string
      entry_id: string | null
      employee_id: string
      captured_at: string
      active_window: string | null
      ai_summary: string | null
      productivity_score: number | null
      ocr_text: string | null
      employee_name: string | null
      employee_initials: string | null
      employee_color: string | null
      project_name: string | null
    }>(query, [...params, limit, offset])

    const items = screenshots.map((s) => ({
      id: s.id,
      employeeId: s.employee_id,
      employeeName: s.employee_name ?? 'Unknown',
      employeeInitials: s.employee_initials ?? 'NA',
      employeeColor: s.employee_color ?? '#4b6fed',
      projectName: s.project_name ?? 'Unassigned',
      capturedAt: s.captured_at,
      activeWindow: s.active_window,
      aiSummary: s.ai_summary,
      productivityScore: s.productivity_score,
      ocrText: s.ocr_text,
      imageUrl: `/api/screenshots/${s.id}`,
    }))

    res.json({
      screenshots: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (err) {
    console.error('Error fetching admin screenshots:', err)
    res.status(500).json({ error: 'Failed to fetch screenshots feed.' })
  }
})

/**
 * GET /api/admin/analytics
 * System productivity & focus score distribution across time range.
 */
router.get('/analytics', async (req, res) => {
  try {
    const range = typeof req.query.range === 'string' ? req.query.range : 'week'
    const { start, end } = getRangeBounds(range)

    // Top apps system wide
    const topApps = await all<{ name: string; minutes: number }>(
      'SELECT app as name, SUM(duration_minutes) as minutes FROM activity_samples WHERE sampled_at >= ? AND sampled_at <= ? GROUP BY app ORDER BY minutes DESC LIMIT 10',
      [start.toISOString(), end.toISOString()],
    )

    // Top URLs system wide
    const topUrls = await all<{ name: string; minutes: number }>(
      'SELECT url as name, SUM(duration_minutes) as minutes FROM activity_samples WHERE sampled_at >= ? AND sampled_at <= ? GROUP BY url ORDER BY minutes DESC LIMIT 10',
      [start.toISOString(), end.toISOString()],
    )

    // Focus score breakdown by employee
    const employees = await all<{ id: string; name: string; initials: string; color: string }>('SELECT id, name, initials, color FROM employees')
    const employeeScores = await Promise.all(
      employees.map(async (e) => {
        const scoreData = await computeFocusScore(e.id, start, end)
        return {
          id: e.id,
          name: e.name,
          initials: e.initials,
          color: e.color,
          focusScore: scoreData.score,
          trackedMinutes: scoreData.trackedMinutes,
        }
      }),
    )

    res.json({
      range,
      rangeLabel: rangeLabel(range),
      topApps,
      topUrls,
      employeeScores: employeeScores.sort((a, b) => b.focusScore - a.focusScore),
    })
  } catch (err) {
    console.error('Error fetching admin analytics:', err)
    res.status(500).json({ error: 'Failed to fetch productivity analytics.' })
  }
})

/**
 * GET /api/admin/insights
 * Generates company-wide AI summary and insights.
 */
router.get('/insights', async (req, res) => {
  try {
    const range = typeof req.query.range === 'string' ? req.query.range : 'today'
    const { start, end } = getRangeBounds(range)

    const entries = await all<{ seconds: number }>(
      'SELECT seconds FROM time_entries WHERE started_at >= ? AND started_at < ?',
      [start.toISOString(), end.toISOString()],
    )
    const totalMinutes = Math.round(entries.reduce((sum, e) => sum + e.seconds, 0) / 60)

    const topAppRow = await get<{ app: string }>(
      'SELECT app, SUM(duration_minutes) as total FROM activity_samples WHERE sampled_at >= ? AND sampled_at < ? GROUP BY app ORDER BY total DESC LIMIT 1',
      [start.toISOString(), end.toISOString()],
    )

    const avgScoreRow = await get<{ avg: number }>(
      'SELECT AVG(activity) as avg FROM activity_samples WHERE sampled_at >= ? AND sampled_at < ?',
      [start.toISOString(), end.toISOString()],
    )

    const focusScore = Math.round(Number(avgScoreRow?.avg ?? 82))

    const summary = heuristicProvider.generateSummary({
      employeeName: 'ActivityIQ Team',
      rangeLabel: rangeLabel(range),
      totalMinutes,
      focusScore,
      topProject: 'Website Redesign & Platform API',
      topApp: topAppRow?.app ?? 'VS Code',
      entryCount: entries.length,
    })

    res.json({
      summary,
      focusScore,
      totalMinutes,
      entryCount: entries.length,
      topApp: topAppRow?.app ?? 'VS Code',
      range,
      rangeLabel: rangeLabel(range),
    })
  } catch (err) {
    console.error('Error generating AI insights:', err)
    res.status(500).json({ error: 'Failed to generate AI insights.' })
  }
})

/**
 * GET /api/admin/reports
 * Aggregates report metrics and supports CSV download.
 */
router.get('/reports', async (req, res) => {
  try {
    const range = typeof req.query.range === 'string' ? req.query.range : 'week'
    const format = req.query.format === 'csv' ? 'csv' : 'json'
    const { start, end } = getRangeBounds(range)

    const query = `
      SELECT e.id as employee_id, e.name as employee_name, e.role, p.name as project_name,
             COUNT(t.id) as session_count,
             COALESCE(SUM(t.seconds), 0) as total_seconds
      FROM employees e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN time_entries t ON t.employee_id = e.id AND t.started_at >= ? AND t.started_at <= ?
      GROUP BY e.id, e.name, e.role, p.name
      ORDER BY total_seconds DESC
    `

    const rows = await all<{
      employee_id: string
      employee_name: string
      role: string
      project_name: string | null
      session_count: number
      total_seconds: number
    }>(query, [start.toISOString(), end.toISOString()])

    const reportItems = rows.map((r) => ({
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      role: r.role,
      projectName: r.project_name ?? 'Unassigned',
      sessionCount: r.session_count,
      totalHours: Number((r.total_seconds / 3600).toFixed(2)),
    }))

    if (format === 'csv') {
      let csv = 'Employee Name,Role,Project,Sessions,Total Hours\n'
      for (const item of reportItems) {
        csv += `"${item.employeeName}","${item.role}","${item.projectName}",${item.sessionCount},${item.totalHours}\n`
      }
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=activityiq_report_${range}.csv`)
      res.send(csv)
      return
    }

    res.json({
      range,
      rangeLabel: rangeLabel(range),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      items: reportItems,
    })
  } catch (err) {
    console.error('Error generating reports:', err)
    res.status(500).json({ error: 'Failed to generate report.' })
  }
})

/**
 * GET & PUT /api/admin/settings
 * Admin platform configurations.
 */
let systemSettings = {
  appName: 'ActivityIQ',
  screenshotFrequencyMinutes: 10,
  ocrEnabled: true,
  idleThresholdMinutes: 5,
  defaultRole: 'Team Member',
  adminEmailContact: process.env.ADMIN_EMAIL || '',
}

router.get('/settings', (_req, res) => {
  res.json({ settings: systemSettings })
})

router.put('/settings', (req, res) => {
  const updated = { ...systemSettings, ...(req.body ?? {}) }
  systemSettings = updated
  res.json({ settings: systemSettings })
})

export default router
