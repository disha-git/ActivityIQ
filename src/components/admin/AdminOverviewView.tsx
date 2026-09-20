import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Radio,
  Clock,
  Zap,
  Briefcase,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Plus,
  FileSpreadsheet,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { api, type AdminOverviewResponse } from '../../lib/api'
import Avatar from '../ui/Avatar'

interface OverviewViewProps {
  onNavigateTab: (tab: any) => void
  onOpenEmployeeModal: () => void
  onOpenProjectModal: () => void
}

export default function AdminOverviewView({
  onNavigateTab,
  onOpenEmployeeModal,
  onOpenProjectModal,
}: OverviewViewProps) {
  const [data, setData] = useState<AdminOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function fetchOverview() {
    setLoading(true)
    setError(null)
    api
      .adminGetOverview()
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to load overview data.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/30 dark:bg-rose-950/20">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <h3 className="font-bold text-rose-700 dark:text-rose-400">Error Loading Overview</h3>
          <p className="mt-1 text-sm text-rose-600/80 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={fetchOverview}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { metrics, dailyTrend, projectDistribution, recentFeed } = data

  const statCards = [
    {
      title: 'Total Employees',
      value: metrics.totalEmployees,
      subtext: `${metrics.onlineEmployeesCount} currently online`,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Live Tracking Now',
      value: metrics.activeTrackingCount,
      subtext: 'Active desktop agents',
      icon: Radio,
      color: 'from-emerald-500 to-teal-600',
      pulse: metrics.activeTrackingCount > 0,
    },
    {
      title: 'Hours Logged Today',
      value: `${metrics.todayHours}h`,
      subtext: `${metrics.weekHours}h this week`,
      icon: Clock,
      color: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Average Focus Score',
      value: `${metrics.avgFocusScore}%`,
      subtext: metrics.avgFocusScore >= 80 ? 'High productivity' : 'Normal productivity',
      icon: Zap,
      color: 'from-amber-500 to-orange-600',
    },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Stat Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.title}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-soft`}>
                <card.icon size={18} />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-ink dark:text-white sm:text-3xl">{card.value}</span>
              {card.pulse && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{card.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Admin Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-brand-600 dark:text-brand-400" />
          <span className="text-sm font-semibold text-ink dark:text-white">Admin Quick Actions</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenEmployeeModal}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-soft hover:bg-brand-700 transition-colors"
          >
            <Plus size={15} /> Add Employee
          </button>
          <button
            type="button"
            onClick={onOpenProjectModal}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
          >
            <Briefcase size={15} /> Create Project
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('monitoring')}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
          >
            <Radio size={15} /> Live Pulse View
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
          >
            <FileSpreadsheet size={15} /> Reports
          </button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daily Tracked Hours Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink dark:text-white">Daily Tracked Hours</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Company-wide tracked hours over the last 7 days</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} hours`, 'Hours']}
                />
                <Bar dataKey="hours" fill="#4b6fed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Hours Distribution */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink dark:text-white">Project Hours</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Monthly time distribution</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('projects')}
              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              View all
            </button>
          </div>

          <div className="space-y-4">
            {projectDistribution.map((proj) => (
              <div key={proj.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-ink dark:text-slate-200">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: proj.color }} />
                    <span className="truncate max-w-[140px]">{proj.name}</span>
                  </div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{proj.hours}h</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (proj.hours / Math.max(1, metrics.monthHours)) * 100)}%`,
                      backgroundColor: proj.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-ink dark:text-white">Live Activity Stream</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Latest active window & app samples from employees</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('monitoring')}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            <span>Real-time grid</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {recentFeed.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No recent activity samples logged yet.</p>
          ) : (
            recentFeed.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar initials={item.employeeInitials} color={item.employeeColor} size={32} />
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink dark:text-white">
                      <span>{item.employeeName}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {item.app}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-sm">
                      {item.url || 'Active window sample'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.activity >= 80
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : item.activity >= 50
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {item.activity}% Activity
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
