import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Monitor, Clock, Zap, RefreshCw, AlertCircle } from 'lucide-react'
import { api, type AdminRealtimeSession } from '../../lib/api'
import Avatar from '../ui/Avatar'
import { useSocket } from '../../hooks/useSocket'
import { formatTime } from '../../lib/format'

export default function AdminRealtimeView() {
  const [sessions, setSessions] = useState<AdminRealtimeSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  function loadRealtimeData() {
    setLoading(true)
    setError(null)
    api
      .adminGetRealtime()
      .then((res) => {
        setSessions(res.activeSessions)
        setLastUpdated(new Date())
      })
      .catch((err) => setError(err.message || 'Failed to fetch live monitoring sessions.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRealtimeData()
    // Poll every 15 seconds as a safety backup
    const interval = setInterval(loadRealtimeData, 15000)
    return () => clearInterval(interval)
  }, [])

  // Listen to Socket.IO events for instant updates
  useSocket({
    onTrackingStarted: () => loadRealtimeData(),
    onTrackingStopped: () => loadRealtimeData(),
    onActivitySample: (sample) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.employeeId === sample.employeeId) {
            return {
              ...s,
              currentApp: sample.app,
              currentUrl: sample.url,
              currentActivityScore: sample.activity,
            }
          }
          return s
        }),
      )
    },
    onScreenshot: (shot) => {
      setSessions((prev) =>
        prev.map((s) => (s.employeeId === shot.employeeId ? { ...s, lastScreenshotAt: shot.capturedAt } : s)),
      )
    },
  })

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink dark:text-white">Real-time Employee Monitoring</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Live Socket.IO activity stream • Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            {sessions.length} Employees Tracking Now
          </span>

          <button
            type="button"
            onClick={loadRealtimeData}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
            title="Refresh feed"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <Radio size={48} className="mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No Active Sessions</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            None of your employees are currently running an active desktop tracking session. As soon as someone starts tracking, their live session will show up here instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {sessions.map((session) => {
              const score = session.currentActivityScore
              const scoreColor =
                score >= 80
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : score >= 50
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'

              return (
                <motion.div
                  key={session.entryId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all hover:shadow-soft-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Status Banner */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={session.employeeInitials} color={session.employeeColor} size={36} />
                      <div>
                        <h4 className="text-sm font-bold text-ink dark:text-white">{session.employeeName}</h4>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{session.employeeRole}</span>
                      </div>
                    </div>

                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                      {session.projectName}
                    </span>
                  </div>

                  {/* Tracking Metrics */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Monitor size={14} /> Active Application
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{session.currentApp}</span>
                    </div>

                    {session.currentUrl && (
                      <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-850 dark:text-slate-300 truncate">
                        <span className="font-semibold text-slate-400">Context:</span> {session.currentUrl}
                      </div>
                    )}

                    {session.note && (
                      <div className="text-xs italic text-slate-500 dark:text-slate-400 truncate">
                        "{session.note}"
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock size={14} /> Duration: <span className="font-bold text-ink dark:text-white">{formatTime(session.liveSeconds)}</span>
                      </div>

                      <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${scoreColor}`}>
                        <Zap size={12} /> {score}% Activity
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
