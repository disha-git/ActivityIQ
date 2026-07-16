import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, ChevronDown, ChevronUp, Timer } from 'lucide-react'
import Select from '../ui/Select'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useTracker } from '../../hooks/useTracker'
import { formatClock } from '../../lib/format'
import type { ApiProject } from '../../lib/api'

interface TrackerWidgetProps {
  projects: ApiProject[]
  onEntryStopped: () => void
}

export default function TrackerWidget({ projects, onEntryStopped }: TrackerWidgetProps) {
  const { isTracking, projectId, setProjectId, note, setNote, elapsed, busy, error, start, stop } = useTracker(
    projects,
    onEntryStopped,
  )
  const [minimized, setMinimized] = useState(false)
  const activeProject = projects.find((p) => p.id === projectId)

  return (
    <AnimatePresence mode="wait">
      {minimized ? (
        <motion.button
          key="mini"
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={() => setMinimized(false)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full border border-slate-200/70 bg-white/90 px-4 py-2.5 shadow-soft-lg backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90"
        >
          <span className={`h-2 w-2 rounded-full ${isTracking ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
          <Timer size={14} className="text-slate-400 dark:text-slate-500" />
          <span className="text-sm font-semibold tabular-nums text-ink dark:text-white">{formatClock(elapsed)}</span>
          <ChevronUp size={14} className="text-slate-400 dark:text-slate-500" />
        </motion.button>
      ) : (
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 34 }}
          className="fixed inset-x-0 bottom-0 z-40 w-full rounded-t-2xl border border-slate-200/70 bg-white/90 p-5 shadow-soft-lg backdrop-blur-xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-80 sm:rounded-2xl dark:border-slate-700/70 dark:bg-slate-900/90"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
              <span className={`h-2 w-2 rounded-full ${isTracking ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]' : 'bg-slate-300 dark:bg-slate-600'}`} />
              Tracker
            </div>
            <button
              type="button"
              onClick={() => setMinimized(true)}
              aria-label="Minimize"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <Select label="Project" name="tracker-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={isTracking}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>

            <Input
              label="Note"
              name="tracker-note"
              placeholder="What are you working on?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isTracking}
              autoComplete="off"
            />

            <div
              className="rounded-xl border-2 py-3 text-center text-2xl font-bold tabular-nums text-ink transition-colors dark:text-white"
              style={{ borderColor: isTracking ? activeProject?.color : undefined }}
            >
              {formatClock(elapsed)}
            </div>

            {error && <p className="text-center text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}

            {isTracking ? (
              <Button variant="primary" size="lg" className="w-full !bg-gradient-to-b !from-red-500 !to-red-600" icon={<Square size={15} fill="currentColor" />} onClick={stop} disabled={busy}>
                Stop
              </Button>
            ) : (
              <Button variant="primary" size="lg" className="w-full" icon={<Play size={15} fill="currentColor" />} onClick={start} disabled={busy || !projectId}>
                Start
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
