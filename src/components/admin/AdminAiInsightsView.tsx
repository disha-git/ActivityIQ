import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import { api, type AdminAiInsightsResponse } from '../../lib/api'

export default function AdminAiInsightsView() {
  const [range, setRange] = useState('today')
  const [data, setData] = useState<AdminAiInsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function loadInsights() {
    setLoading(true)
    setError(null)
    api
      .adminGetInsights(range)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to generate AI insights.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadInsights()
  }, [range])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-soft">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink dark:text-white">AI Executive Insights Engine</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Automated narrative summaries and team performance dynamics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            type="button"
            onClick={loadInsights}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      ) : error || !data ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main AI Summary Glass Card */}
          <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-600 to-indigo-700 p-6 text-white shadow-soft-lg sm:p-8">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-brand-200">
              <Sparkles size={16} /> AI Executive Summary ({data.rangeLabel})
            </div>

            <p className="mt-4 text-base font-medium leading-relaxed sm:text-lg text-brand-50">
              "{data.summary}"
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
              <div>
                <span className="text-xs text-brand-200">Team Focus Score</span>
                <div className="text-2xl font-extrabold text-white mt-1">{data.focusScore}%</div>
              </div>
              <div>
                <span className="text-xs text-brand-200">Total Minutes Logged</span>
                <div className="text-2xl font-extrabold text-white mt-1">{data.totalMinutes} m</div>
              </div>
              <div>
                <span className="text-xs text-brand-200">Tracking Sessions</span>
                <div className="text-2xl font-extrabold text-white mt-1">{data.entryCount}</div>
              </div>
              <div>
                <span className="text-xs text-brand-200">Primary Software</span>
                <div className="text-2xl font-extrabold text-white mt-1 truncate">{data.topApp}</div>
              </div>
            </div>
          </div>

          {/* AI Key Recommendations */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-ink dark:text-white mb-4">AI Management Recommendations</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-850">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs dark:text-emerald-400">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-bold text-ink dark:text-white">Optimal Deep Work Windows</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Team focus scores peak between 10:00 AM and 1:00 PM. Schedule major architectural design or critical coding sessions during this 3-hour window for maximum throughput.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-850">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 font-bold text-xs dark:text-brand-400">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-bold text-ink dark:text-white">Context Switching Prevention</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Frequent context switching between chat applications (Slack/Gmail) and development IDEs drops focus scores by ~14%. Encourage asynchronous communication blocks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
