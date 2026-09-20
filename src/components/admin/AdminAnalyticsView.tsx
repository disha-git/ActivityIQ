import { useEffect, useState } from 'react'
import { LineChart as LineChartIcon, Monitor, Globe, Zap, AlertCircle } from 'lucide-react'
import { api, type AdminAnalyticsResponse } from '../../lib/api'
import Avatar from '../ui/Avatar'

export default function AdminAnalyticsView() {
  const [range, setRange] = useState('week')
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function loadAnalytics() {
    setLoading(true)
    setError(null)
    api
      .adminGetAnalytics(range)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to fetch analytics.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAnalytics()
  }, [range])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header & Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <LineChartIcon size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink dark:text-white">Productivity & Focus Analytics</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Aggregated focus scores, top application usage, and site analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-850">
          {['today', 'week', 'month'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                range === r
                  ? 'bg-white text-ink shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-ink dark:text-slate-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : error || !data ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : (
        <>
          {/* Employee Focus Leaderboard */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-amber-500" />
              <h3 className="text-sm font-bold text-ink dark:text-white">Team Focus Score Rankings ({data.rangeLabel})</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.employeeScores.map((emp, i) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-850"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-400 text-xs w-4">#{i + 1}</span>
                    <Avatar initials={emp.initials} color={emp.color} size={32} />
                    <div>
                      <div className="text-xs font-bold text-ink dark:text-white">{emp.name}</div>
                      <div className="text-[11px] text-slate-400">{emp.trackedMinutes} mins tracked</div>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      emp.focusScore >= 80
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : emp.focusScore >= 50
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {emp.focusScore}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Applications & Top Sites */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Apps */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-4">
                <Monitor size={18} className="text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-bold text-ink dark:text-white">Top Enterprise Applications</h3>
              </div>

              <div className="space-y-3">
                {data.topApps.map((app) => (
                  <div key={app.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink dark:text-slate-200">{app.name}</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">{app.minutes} mins</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Websites */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={18} className="text-teal-500" />
                <h3 className="text-sm font-bold text-ink dark:text-white">Top Visited Domains</h3>
              </div>

              <div className="space-y-3">
                {data.topUrls.map((url) => (
                  <div key={url.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink dark:text-slate-200 truncate max-w-[220px]">{url.name}</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{url.minutes} mins</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
