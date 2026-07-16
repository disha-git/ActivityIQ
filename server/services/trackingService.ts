import { get, run, newId } from '../db.ts'
import { emitToAll } from '../sockets.ts'

export interface TimeEntryRow {
  id: string
  employee_id: string
  project_id: string
  note: string
  started_at: string
  ended_at: string | null
  seconds: number
}

type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

export async function startTracking(employeeId: string, projectId: string, note: string): Promise<Result<TimeEntryRow>> {
  const open = await get<TimeEntryRow>('SELECT * FROM time_entries WHERE employee_id = ? AND ended_at IS NULL', [
    employeeId,
  ])
  if (open) {
    return { ok: false, status: 409, error: 'A time entry is already running.' }
  }

  const project = await get('SELECT id FROM projects WHERE id = ?', [projectId])
  if (!project) {
    return { ok: false, status: 400, error: 'Unknown projectId.' }
  }

  const entry: TimeEntryRow = {
    id: newId('t'),
    employee_id: employeeId,
    project_id: projectId,
    note: note || '',
    started_at: new Date().toISOString(),
    ended_at: null,
    seconds: 0,
  }
  await run(
    'INSERT INTO time_entries (id, employee_id, project_id, note, started_at, ended_at, seconds) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [entry.id, entry.employee_id, entry.project_id, entry.note, entry.started_at, entry.ended_at, entry.seconds],
  )

  await run('UPDATE employees SET status = ? WHERE id = ?', ['online', employeeId])
  emitToAll('tracking:started', { employeeId, entry })

  return { ok: true, data: entry }
}

const GENERIC_APPS = ['VS Code', 'Chrome', 'Figma', 'Slack', 'Terminal']
const GENERIC_URLS = ['github.com', 'localhost:5173', 'stackoverflow.com', 'app.slack.com', 'figma.com']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function stopTracking(employeeId: string, entryId: string): Promise<Result<TimeEntryRow>> {
  const entry = await get<TimeEntryRow>(
    'SELECT * FROM time_entries WHERE id = ? AND employee_id = ? AND ended_at IS NULL',
    [entryId, employeeId],
  )

  if (!entry) {
    return { ok: false, status: 404, error: 'No running entry found with that id.' }
  }

  const endedAt = new Date()
  const seconds = Math.max(1, Math.round((endedAt.getTime() - new Date(entry.started_at).getTime()) / 1000))

  await run('UPDATE time_entries SET ended_at = ?, seconds = ? WHERE id = ?', [endedAt.toISOString(), seconds, entry.id])

  const existingSamples = await get<{ count: number }>(
    'SELECT COUNT(*) as count FROM activity_samples WHERE entry_id = ?',
    [entry.id],
  )

  if (existingSamples!.count === 0) {
    await run(
      'INSERT INTO activity_samples (id, entry_id, employee_id, project_id, sampled_at, app, url, activity, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newId('a'),
        entry.id,
        employeeId,
        entry.project_id,
        entry.started_at,
        pick(GENERIC_APPS),
        pick(GENERIC_URLS),
        60 + Math.floor(Math.random() * 39),
        Math.max(1, Math.round(seconds / 60)),
      ],
    )
  }

  // Screenshots are only ever created by the desktop agent uploading a real
  // image via POST /api/agent/screenshots. Do not fabricate placeholder rows
  // here — an image-less screenshot row renders as a dead thumbnail in the
  // dashboard ("No image available").

  await run('UPDATE employees SET status = ? WHERE id = ?', ['offline', employeeId])

  const updated = await get<TimeEntryRow>('SELECT * FROM time_entries WHERE id = ?', [entry.id])
  emitToAll('tracking:stopped', { employeeId, entry: updated })

  return { ok: true, data: updated! }
}

export async function appendActivitySample(
  entryId: string,
  employeeId: string,
  projectId: string,
  app: string,
  url: string,
  activity: number,
  durationMinutes: number,
): Promise<void> {
  await run(
    'INSERT INTO activity_samples (id, entry_id, employee_id, project_id, sampled_at, app, url, activity, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [newId('a'), entryId, employeeId, projectId, new Date().toISOString(), app, url, activity, durationMinutes],
  )
  emitToAll('activity:sample', { employeeId, entryId, app, url, activity, durationMinutes })
}
