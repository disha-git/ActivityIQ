import { useState } from 'react'
import { Camera } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import type { AppPage } from '../components/layout/Sidebar'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import StatCardRow from '../components/dashboard/StatCardRow'
import TeamList from '../components/dashboard/TeamList'
import ActivityTimeline from '../components/dashboard/ActivityTimeline'
import UsageChart from '../components/dashboard/UsageChart'
import ScreenshotViewer from '../components/dashboard/ScreenshotViewer'
import AiSummaryCard from '../components/dashboard/AiSummaryCard'
import { useEmployees } from '../hooks/useEmployees'
import { useTimeline } from '../hooks/useTimeline'
import { useSocket } from '../hooks/useSocket'
import type { ApiEmployee, ApiProject, ApiUser } from '../lib/api'

type Range = 'today' | 'yesterday' | 'week' | 'month'

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

interface DashboardPageProps {
  user: ApiUser
  employee: ApiEmployee
  projects: ApiProject[]
  onNavigate: (page: AppPage) => void
  onLogout: () => void
  refreshSignal: number
}

export default function DashboardPage({ user, employee, projects, onNavigate, onLogout, refreshSignal }: DashboardPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(employee.id)
  const [range, setRange] = useState<Range>('today')
  const [liveTick, setLiveTick] = useState(0)

  const { employees, loading: employeesLoading } = useEmployees(refreshSignal)
  const { timeline, loading: timelineLoading } = useTimeline(selectedId, range, refreshSignal + liveTick)

  useSocket({
    onScreenshot: (payload) => {
      if (payload.employeeId === selectedId) setLiveTick((n) => n + 1)
    },
    onActivitySample: (payload) => {
      if (payload.employeeId === selectedId) setLiveTick((n) => n + 1)
    },
    onTrackingStarted: (payload) => {
      if (payload.employeeId === selectedId) setLiveTick((n) => n + 1)
    },
    onTrackingStopped: (payload) => {
      if (payload.employeeId === selectedId) setLiveTick((n) => n + 1)
    },
  })

  const selected = employees.find((e) => e.id === selectedId)
  const project = projects.find((p) => p.id === selected?.project_id)
  const rangeSeconds = timeline ? timeline.entries.reduce((sum, e) => sum + e.durationMinutes * 60, 0) : 0

  return (
    <AppShell
      page="dashboard"
      onNavigate={onNavigate}
      user={user}
      employee={employee}
      onLogout={onLogout}
      title="Dashboard"
      subtitle={selected ? `${selected.name} · ${project?.name ?? ''}` : undefined}
    >
      <div className="space-y-6">
        <StatCardRow
          loading={employeesLoading}
          rangeLabel={RANGE_OPTIONS.find((r) => r.value === range)!.label}
          rangeSeconds={rangeSeconds}
          weekSeconds={selected?.weekSeconds ?? 0}
          monthSeconds={selected?.monthSeconds ?? 0}
          status={selected?.status ?? 'offline'}
        />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card className="p-3">
            <div className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Team
            </div>
            <TeamList
              loading={employeesLoading}
              employees={employees}
              projects={projects}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </Card>

          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-ink dark:text-white">Activity timeline</h2>
                <Tabs value={range} options={RANGE_OPTIONS} onChange={setRange} />
              </div>
              <ActivityTimeline loading={timelineLoading} entries={timeline?.entries ?? []} accentColor={project?.color} />

              <div className="mt-7 flex items-center gap-1.5 border-t border-slate-100 pt-6 text-sm font-semibold text-ink dark:border-slate-800 dark:text-white">
                <Camera size={15} /> Screenshots
              </div>
              <div className="mt-4">
                <ScreenshotViewer loading={timelineLoading} screenshots={timeline?.screenshots ?? []} accentColor={project?.color} />
              </div>
            </Card>

            <AiSummaryCard employeeId={selectedId} range={range} />

            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="p-5 sm:p-6">
                <h2 className="mb-4 text-sm font-semibold text-ink dark:text-white">Apps used</h2>
                <UsageChart loading={timelineLoading} data={timeline?.appUsage ?? []} color="#2563eb" />
              </Card>
              <Card className="p-5 sm:p-6">
                <h2 className="mb-4 text-sm font-semibold text-ink dark:text-white">Websites visited</h2>
                <UsageChart loading={timelineLoading} data={timeline?.urlUsage ?? []} color="#4f46e5" />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
