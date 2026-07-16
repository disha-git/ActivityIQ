import { useState } from 'react'
import AppShell from '../components/layout/AppShell'
import type { AppPage } from '../components/layout/Sidebar'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import Select from '../components/ui/Select'
import AiSummaryCard from '../components/dashboard/AiSummaryCard'
import UsageChart from '../components/dashboard/UsageChart'
import { useEmployees } from '../hooks/useEmployees'
import { useTimeline } from '../hooks/useTimeline'
import type { ApiEmployee, ApiProject, ApiUser } from '../lib/api'

type Range = 'week' | 'month'

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

interface ReportsPageProps {
  user: ApiUser
  employee: ApiEmployee
  projects: ApiProject[]
  onNavigate: (page: AppPage) => void
  onLogout: () => void
}

export default function ReportsPage({ user, employee, projects, onNavigate, onLogout }: ReportsPageProps) {
  const [selectedId, setSelectedId] = useState(employee.id)
  const [range, setRange] = useState<Range>('week')

  const { employees } = useEmployees(0)
  const { timeline, loading } = useTimeline(selectedId, range, 0)

  const selected = employees.find((e) => e.id === selectedId) ?? employee
  const project = projects.find((p) => p.id === selected.project_id)

  return (
    <AppShell
      page="reports"
      onNavigate={onNavigate}
      user={user}
      employee={employee}
      onLogout={onLogout}
      title="Reports"
      subtitle="AI-generated weekly insights"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select
            label="Employee"
            name="reports-employee"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="min-w-[200px]"
          >
            {(employees.length > 0 ? employees : [employee]).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
          <Tabs value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>

        <AiSummaryCard employeeId={selectedId} range={range} />

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-ink dark:text-white">Apps used</h2>
            <UsageChart loading={loading} data={timeline?.appUsage ?? []} color={project?.color ?? '#2563eb'} />
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-ink dark:text-white">Websites visited</h2>
            <UsageChart loading={loading} data={timeline?.urlUsage ?? []} color="#4f46e5" />
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
