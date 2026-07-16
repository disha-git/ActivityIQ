import { Router } from 'express'
import { all, get, run, newId } from '../db.ts'
import { requireAuth } from '../auth.ts'
import { getRangeBounds, rangeLabel } from '../lib/dateRange.ts'
import { computeFocusScore } from '../services/ai/focusScore.ts'
import { heuristicProvider } from '../services/ai/heuristicProvider.ts'

const router = Router()

router.get('/focus-score/:employeeId', requireAuth, async (req, res) => {
  const { employeeId } = req.params
  const range = typeof req.query.range === 'string' ? req.query.range : 'today'
  const { start, end } = getRangeBounds(range)

  const result = await computeFocusScore(employeeId, start, end)
  res.json({ ...result, range, rangeLabel: rangeLabel(range) })
})

interface EntryRow {
  id: string
  project_id: string
  seconds: number
}

router.get('/summary/:employeeId', requireAuth, async (req, res) => {
  const { employeeId } = req.params
  const range = typeof req.query.range === 'string' ? req.query.range : 'today'
  const { start, end } = getRangeBounds(range)

  const employee = await get<{ name: string }>('SELECT name FROM employees WHERE id = ?', [employeeId])
  if (!employee) {
    res.status(404).json({ error: 'Unknown employee.' })
    return
  }

  const entries = await all<EntryRow>(
    'SELECT id, project_id, seconds FROM time_entries WHERE employee_id = ? AND started_at >= ? AND started_at < ?',
    [employeeId, start.toISOString(), end.toISOString()],
  )

  const totalMinutes = Math.round(entries.reduce((sum, e) => sum + e.seconds, 0) / 60)

  const projectMinutes = new Map<string, number>()
  for (const e of entries) {
    projectMinutes.set(e.project_id, (projectMinutes.get(e.project_id) ?? 0) + e.seconds / 60)
  }
  const topProjectId = [...projectMinutes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const topProject = topProjectId
    ? ((await get<{ name: string }>('SELECT name FROM projects WHERE id = ?', [topProjectId]))?.name ?? null)
    : null

  const entryIds = entries.map((e) => e.id)
  let topApp: string | null = null
  if (entryIds.length > 0) {
    const placeholders = entryIds.map(() => '?').join(',')
    const appRow = await get<{ app: string }>(
      `SELECT app, SUM(duration_minutes) as total FROM activity_samples WHERE entry_id IN (${placeholders}) GROUP BY app ORDER BY total DESC LIMIT 1`,
      entryIds,
    )
    topApp = appRow?.app ?? null
  }

  const { score: focusScore } = await computeFocusScore(employeeId, start, end)

  const summary = heuristicProvider.generateSummary({
    employeeName: employee.name,
    rangeLabel: rangeLabel(range),
    totalMinutes,
    focusScore,
    topProject,
    topApp,
    entryCount: entries.length,
  })

  const rangeKey = `${range}:${start.toISOString().slice(0, 10)}`
  await run(
    `INSERT INTO ai_insights (id, employee_id, range_key, type, summary, focus_score, generated_at)
     VALUES (?, ?, ?, 'summary', ?, ?, ?)
     ON DUPLICATE KEY UPDATE summary = VALUES(summary), focus_score = VALUES(focus_score), generated_at = VALUES(generated_at)`,
    [newId('ai'), employeeId, rangeKey, summary, focusScore, new Date().toISOString()],
  )

  res.json({ summary, focusScore, totalMinutes, topProject, topApp, entryCount: entries.length, range, rangeLabel: rangeLabel(range) })
})

export default router
