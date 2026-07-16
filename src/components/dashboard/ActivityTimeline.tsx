import { motion } from 'framer-motion'
import { ListTree } from 'lucide-react'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import type { TimelineEntry } from '../../lib/api'

interface ActivityTimelineProps {
  loading: boolean
  entries: TimelineEntry[]
  accentColor?: string
}

export default function ActivityTimeline({ loading, entries, accentColor }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<ListTree size={18} />}
        title="No activity yet"
        description="Start the tracker to see activity show up here in real time."
      />
    )
  }

  return (
    <div className="space-y-2.5">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.02 }}
          className={`grid grid-cols-[46px_1fr_90px_1fr_44px] items-center gap-3 text-xs sm:text-[13px] ${
            entry.isLive ? 'animate-pulse' : ''
          }`}
        >
          <span className="tabular-nums text-slate-400 dark:text-slate-500">{entry.time}</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500 dark:bg-brand-400"
              style={{ width: `${entry.activity}%`, background: entry.isLive ? accentColor : undefined }}
            />
          </div>
          <span className="truncate font-semibold text-ink dark:text-white">{entry.app}</span>
          <span className="truncate text-slate-500 dark:text-slate-400">{entry.url}</span>
          <span className="text-right font-semibold text-ink dark:text-white">{entry.durationMinutes}m</span>
        </motion.div>
      ))}
    </div>
  )
}
