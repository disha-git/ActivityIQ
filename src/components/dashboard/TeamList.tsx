import { motion } from 'framer-motion'
import Avatar from '../ui/Avatar'
import Skeleton from '../ui/Skeleton'
import { formatDuration } from '../../lib/format'
import type { ApiEmployee, ApiProject } from '../../lib/api'

interface TeamListProps {
  loading: boolean
  employees: ApiEmployee[]
  projects: ApiProject[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function TeamList({ loading, employees, projects, selectedId, onSelect }: TeamListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {employees.map((emp, i) => {
        const project = projects.find((p) => p.id === emp.project_id)
        const active = emp.id === selectedId
        return (
          <motion.button
            key={emp.id}
            type="button"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            onClick={() => onSelect(emp.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
              active ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Avatar initials={emp.initials} color={emp.color} status={emp.status} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink dark:text-white">
                {emp.name}
                {emp.isYou && <span className="text-slate-400 dark:text-slate-500"> (You)</span>}
              </div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{project?.name}</div>
            </div>
            <div className="flex-shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {formatDuration(emp.todaySeconds ?? 0)}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
