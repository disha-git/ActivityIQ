import { useEffect, useState } from 'react'
import { Camera, Search, Eye, AlertCircle, Monitor } from 'lucide-react'
import { api, type AdminScreenshotItem, type ApiEmployee, type ApiProject } from '../../lib/api'
import ScreenshotLightbox from './common/ScreenshotLightbox'
import Avatar from '../ui/Avatar'

export default function AdminScreenshotsView() {
  const [screenshots, setScreenshots] = useState<AdminScreenshotItem[]>([])
  const [employees, setEmployees] = useState<ApiEmployee[]>([])
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Pagination
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [scoreTier, setScoreTier] = useState('all')

  const [selectedShot, setSelectedShot] = useState<AdminScreenshotItem | null>(null)

  function loadScreenshots() {
    setLoading(true)
    setError(null)
    api
      .adminGetScreenshots({
        page,
        limit: 12,
        employeeId: employeeFilter,
        projectId: projectFilter,
        search,
        scoreTier,
      })
      .then((res) => {
        setScreenshots(res.screenshots)
      })
      .catch((err) => setError(err.message || 'Failed to fetch screenshots feed.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.getEmployees().then((res) => setEmployees(res.employees))
    api.getProjects().then((res) => setProjects(res.projects))
  }, [])

  useEffect(() => {
    loadScreenshots()
  }, [page, search, employeeFilter, projectFilter, scoreTier])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Search & Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search active window title, OCR text, or AI summary..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs font-medium text-ink placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-850 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={scoreTier}
            onChange={(e) => {
              setScoreTier(e.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Productivity Scores</option>
            <option value="high">High Productivity (&gt;80%)</option>
            <option value="med">Medium Productivity (50-80%)</option>
            <option value="low">Low Productivity (&lt;50%)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : screenshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <Camera size={48} className="mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No Screenshots Found</h3>
          <p className="mt-1 text-xs text-slate-400">Try loosening your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {screenshots.map((shot) => {
            const score = shot.productivityScore ?? 75
            return (
              <div
                key={shot.id}
                onClick={() => setSelectedShot(shot)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-all hover:scale-[1.02] hover:shadow-soft-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={shot.imageUrl}
                    alt={shot.activeWindow || 'Captured screenshot'}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink shadow-md">
                      <Eye size={14} /> Zoom Screenshot
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar initials={shot.employeeInitials} color={shot.employeeColor} size={24} />
                      <span className="text-xs font-bold text-ink dark:text-white truncate max-w-[120px]">
                        {shot.employeeName}
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        score >= 80
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : score >= 50
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {score}% Score
                    </span>
                  </div>

                  {shot.activeWindow && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                      <Monitor size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{shot.activeWindow}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400">
                    Captured {new Date(shot.capturedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedShot && <ScreenshotLightbox screenshot={selectedShot} onClose={() => setSelectedShot(null)} />}
    </div>
  )
}
