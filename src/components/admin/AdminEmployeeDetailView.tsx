import { useEffect, useState } from 'react'
import { ArrowLeft, Clock, Monitor, Zap, Camera, ShieldCheck, Mail, Calendar, AlertCircle } from 'lucide-react'
import { api, type AdminEmployeeDetailResponse } from '../../lib/api'
import Avatar from '../ui/Avatar'
import ScreenshotLightbox from './common/ScreenshotLightbox'
import { formatTime } from '../../lib/format'

interface EmployeeDetailProps {
  employeeId: string
  onBack: () => void
}

export default function AdminEmployeeDetailView({ employeeId, onBack }: EmployeeDetailProps) {
  const [data, setData] = useState<AdminEmployeeDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedShot, setSelectedShot] = useState<any | null>(null)

  function loadDetail() {
    setLoading(true)
    setError(null)
    api
      .adminGetEmployeeDetail(employeeId)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to fetch employee details.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDetail()
  }, [employeeId])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
        >
          <ArrowLeft size={16} /> Back to Employee List
        </button>
        <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      </div>
    )
  }

  const { employee, focusScore, timeEntries, topApps, topUrls, screenshots } = data

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Hero Employee Card */}
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <Avatar initials={employee.initials} color={employee.color} size={64} />
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-ink dark:text-white">{employee.name}</h2>
              {employee.isAdmin && (
                <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                  <ShieldCheck size={13} /> Admin
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{employee.role}</p>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <Mail size={13} /> {employee.userEmail}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} /> Member since {new Date(employee.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-400">Assigned Project</span>
            <div className="mt-1 font-bold text-ink dark:text-white">{employee.projectName}</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-850">
            <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{focusScore.score}%</div>
            <div className="text-[11px] font-semibold text-slate-400">Today Focus Score</div>
          </div>
        </div>
      </div>

      {/* Grid: App & Site Usage + Screenshots */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Apps */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={18} className="text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-ink dark:text-white">Top Applications Used</h3>
          </div>
          <div className="space-y-3">
            {topApps.length === 0 ? (
              <p className="text-xs text-slate-400">No application usage recorded.</p>
            ) : (
              topApps.map((app) => (
                <div key={app.name} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink dark:text-slate-200">{app.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">{app.minutes} mins</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Websites */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-ink dark:text-white">Top Websites Visited</h3>
          </div>
          <div className="space-y-3">
            {topUrls.length === 0 ? (
              <p className="text-xs text-slate-400">No website activity recorded.</p>
            ) : (
              topUrls.map((url) => (
                <div key={url.name} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink dark:text-slate-200 truncate max-w-[200px]">{url.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">{url.minutes} mins</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Gallery */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <Camera size={18} className="text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-bold text-ink dark:text-white">Screenshot History</h3>
        </div>

        {screenshots.length === 0 ? (
          <p className="text-xs text-slate-400">No screenshots uploaded for this employee.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {screenshots.map((shot) => (
              <div
                key={shot.id}
                onClick={() =>
                  setSelectedShot({
                    ...shot,
                    employeeName: employee.name,
                    employeeInitials: employee.initials,
                    employeeColor: employee.color,
                    projectName: employee.projectName,
                  })
                }
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition-all hover:scale-105 hover:shadow-soft-lg dark:border-slate-800 dark:bg-slate-850"
              >
                <img
                  src={shot.imageUrl}
                  alt={shot.activeWindow || 'Screenshot'}
                  className="h-28 w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 p-2 flex flex-col justify-end">
                  <span className="text-[10px] font-medium text-white truncate">{shot.activeWindow || 'Screenshot'}</span>
                  <span className="text-[9px] text-slate-300">{new Date(shot.capturedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time Entries History Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-violet-500" />
          <h3 className="text-sm font-bold text-ink dark:text-white">Time Tracking Sessions</h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {timeEntries.length === 0 ? (
            <p className="py-4 text-xs text-slate-400">No tracking sessions recorded yet.</p>
          ) : (
            timeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3 text-xs">
                <div>
                  <div className="font-semibold text-ink dark:text-slate-200">
                    {new Date(entry.started_at).toLocaleString()}
                  </div>
                  {entry.note && <p className="text-slate-400 italic">"{entry.note}"</p>}
                </div>
                <div className="font-bold text-brand-600 dark:text-brand-400">
                  {entry.ended_at === null ? 'Active Live Session' : formatTime(entry.seconds)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedShot && <ScreenshotLightbox screenshot={selectedShot} onClose={() => setSelectedShot(null)} />}
    </div>
  )
}
