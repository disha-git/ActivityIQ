import { get, run, newId } from './db.ts'

interface SeedEmployee {
  name: string
  role: string
  initials: string
  color: string
  projectId: string
  status: 'online' | 'offline'
}

const PROJECTS = [
  { id: 'p1', name: 'Website Redesign', color: '#21c17c' },
  { id: 'p2', name: 'Mobile App', color: '#4b6fed' },
  { id: 'p3', name: 'Client Support', color: '#f5a623' },
  { id: 'p4', name: 'Internal Tools', color: '#e0578c' },
]

const PROJECT_POOLS: Record<string, { apps: string[]; urls: string[] }> = {
  p1: { apps: ['VS Code', 'Figma', 'Chrome'], urls: ['github.com/activityiq/web', 'figma.com', 'localhost:5173'] },
  p2: { apps: ['IntelliJ IDEA', 'Postman', 'Chrome'], urls: ['github.com/activityiq/api', 'postman.co', 'stackoverflow.com'] },
  p3: { apps: ['Gmail', 'Zendesk', 'Slack'], urls: ['mail.google.com', 'app.zendesk.com', 'app.slack.com'] },
  p4: { apps: ['VS Code', 'Terminal', 'Chrome'], urls: ['github.com/activityiq/tools', 'localhost:3000', 'npmjs.com'] },
}

const EMPLOYEES: SeedEmployee[] = [
  { name: 'Ava Thompson', role: 'Frontend Engineer', initials: 'AT', color: '#21c17c', projectId: 'p1', status: 'online' },
  { name: 'Marcus Lee', role: 'Backend Engineer', initials: 'ML', color: '#4b6fed', projectId: 'p2', status: 'online' },
  { name: 'Priya Nair', role: 'Customer Success', initials: 'PN', color: '#f5a623', projectId: 'p3', status: 'offline' },
  { name: 'Diego Ruiz', role: 'Product Designer', initials: 'DR', color: '#e0578c', projectId: 'p1', status: 'online' },
  { name: 'Sofia Bianchi', role: 'QA Engineer', initials: 'SB', color: '#8b6cf5', projectId: 'p4', status: 'offline' },
]

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)]
}

export async function seedIfEmpty(): Promise<void> {
  const row = await get<{ count: number }>('SELECT COUNT(*) as count FROM projects')
  if (row && row.count > 0) return

  for (const p of PROJECTS) {
    await run('INSERT INTO projects (id, name, color) VALUES (?, ?, ?)', [p.id, p.name, p.color])
  }

  const now = new Date()

  for (const emp of EMPLOYEES) {
    const empId = newId('e')
    await run(
      'INSERT INTO employees (id, user_id, name, role, initials, color, project_id, status, created_at) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)',
      [empId, emp.name, emp.role, emp.initials, emp.color, emp.projectId, emp.status, now.toISOString()],
    )
    const pool = PROJECT_POOLS[emp.projectId]

    for (let daysAgo = 24; daysAgo >= 0; daysAgo--) {
      const day = new Date(now)
      day.setDate(day.getDate() - daysAgo)
      const isWeekend = day.getDay() === 0 || day.getDay() === 6
      const isToday = daysAgo === 0
      if (isWeekend) continue
      if (isToday && emp.status === 'offline') continue

      const sessions = rand(3, 5)
      let cursorHour = 9
      let cursorMinute = rand(0, 30)

      for (let s = 0; s < sessions; s++) {
        const durationMinutes = rand(25, 70)
        const started = new Date(day)
        started.setHours(cursorHour, cursorMinute, 0, 0)
        const ended = new Date(started.getTime() + durationMinutes * 60_000)

        if (isToday && ended > now) break

        const entryId = newId('t')
        await run(
          'INSERT INTO time_entries (id, employee_id, project_id, note, started_at, ended_at, seconds) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [entryId, empId, emp.projectId, '', started.toISOString(), ended.toISOString(), durationMinutes * 60],
        )

        await run(
          'INSERT INTO activity_samples (id, entry_id, employee_id, project_id, sampled_at, app, url, activity, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newId('a'),
            entryId,
            empId,
            emp.projectId,
            started.toISOString(),
            pick(pool.apps),
            pick(pool.urls),
            rand(58, 98),
            durationMinutes,
          ],
        )

        // No seeded screenshots: `screenshots.image` is LONGBLOB NOT NULL, and
        // there are no real bytes to seed. Real ones arrive from the agent via
        // POST /api/screenshots.

        cursorMinute += durationMinutes + rand(5, 25)
        while (cursorMinute >= 60) {
          cursorMinute -= 60
          cursorHour += 1
        }
      }
    }
  }
}
