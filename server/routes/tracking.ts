import { Router } from 'express'
import { all, get } from '../db.ts'
import { requireAuth, type AuthedRequest } from '../auth.ts'
import { startTracking, stopTracking, type TimeEntryRow } from '../services/trackingService.ts'
import { getRangeBounds } from '../lib/dateRange.ts'

const router = Router()

router.post('/start', requireAuth, async (req: AuthedRequest, res) => {
  const { projectId, note } = req.body ?? {}
  if (!projectId) {
    res.status(400).json({ error: 'projectId is required.' })
    return
  }

  const result = await startTracking(req.employee!.id, projectId, note || '')
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.status(201).json({ entry: result.data })
})

router.post('/stop', requireAuth, async (req: AuthedRequest, res) => {
  const { entryId } = req.body ?? {}
  const result = await stopTracking(req.employee!.id, entryId)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json({ entry: result.data })
})

router.get('/active', requireAuth, async (req: AuthedRequest, res) => {
  const entry = await get<TimeEntryRow>('SELECT * FROM time_entries WHERE employee_id = ? AND ended_at IS NULL', [
    req.employee!.id,
  ])

  if (!entry) {
    res.json({ entry: null })
    return
  }

  const liveSeconds = Math.round((Date.now() - new Date(entry.started_at).getTime()) / 1000)
  res.json({ entry: { ...entry, liveSeconds } })
})

router.get('/timeline/:employeeId', requireAuth, async (req, res) => {
  const { employeeId } = req.params
  const range = typeof req.query.range === 'string' ? req.query.range : 'today'
  const { start, end } = getRangeBounds(range)

  const entries = await all<TimeEntryRow>(
    'SELECT * FROM time_entries WHERE employee_id = ? AND started_at >= ? AND started_at < ? ORDER BY started_at ASC',
    [employeeId, start.toISOString(), end.toISOString()],
  )

  const entryIds = entries.map((e) => e.id)
  const samplesByEntry = new Map<string, { app: string; url: string; activity: number; duration_minutes: number }>()
  const appTotals = new Map<string, number>()
  const urlTotals = new Map<string, number>()

  if (entryIds.length > 0) {
    const placeholders = entryIds.map(() => '?').join(',')
    const samples = await all<{
      entry_id: string
      app: string
      url: string
      activity: number
      duration_minutes: number
    }>(`SELECT * FROM activity_samples WHERE entry_id IN (${placeholders})`, entryIds)
    for (const s of samples) {
      samplesByEntry.set(s.entry_id, s)
      appTotals.set(s.app, (appTotals.get(s.app) ?? 0) + s.duration_minutes)
      urlTotals.set(s.url, (urlTotals.get(s.url) ?? 0) + s.duration_minutes)
    }
  }

  const timeline = entries.map((entry) => {
    const sample = samplesByEntry.get(entry.id)
    const started = new Date(entry.started_at)
    const isLive = entry.ended_at === null
    return {
      id: entry.id,
      time: started.toTimeString().slice(0, 5),
      durationMinutes: isLive
        ? Math.max(1, Math.round((Date.now() - started.getTime()) / 60000))
        : Math.max(1, Math.round(entry.seconds / 60)),
      activity: sample?.activity ?? (isLive ? 88 : 70),
      app: sample?.app ?? (isLive ? 'Live session' : 'Session'),
      url: sample?.url ?? entry.note ?? '',
      isLive,
    }
  })

  // Never SELECT * here — that would pull every LONGBLOB into memory just to
  // build a list of thumbnails. Bytes are fetched per-id via /api/screenshots/:id.
  const screenshots =
    entryIds.length > 0
      ? await all<{ id: string; captured_at: string }>(
          `SELECT id, captured_at FROM screenshots WHERE entry_id IN (${entryIds.map(() => '?').join(',')}) ORDER BY captured_at ASC`,
          entryIds,
        )
      : []

  res.json({
    entries: timeline,
    appUsage: [...appTotals.entries()].map(([name, minutes]) => ({ name, minutes })).sort((a, b) => b.minutes - a.minutes),
    urlUsage: [...urlTotals.entries()].map(([name, minutes]) => ({ name, minutes })).sort((a, b) => b.minutes - a.minutes),
    screenshots: screenshots.map((s) => ({
      id: s.id,
      capturedAt: s.captured_at,
      imageUrl: `/api/screenshots/${s.id}`,
    })),
  })
})

export default router
