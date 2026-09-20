import { Menu } from 'lucide-react'
import type { AdminTab } from './AdminSidebar'

interface AdminTopbarProps {
  currentTab: AdminTab
  activeTrackingCount?: number
  onOpenMobileSidebar: () => void
  onSearchSubmit?: (query: string) => void
}

const TAB_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: { title: 'Admin Overview', subtitle: 'Real-time platform metrics, hours, and activity analytics' },
  monitoring: { title: 'Real-time Pulse Monitoring', subtitle: 'Live activity feed and window tracking' },
  employees: { title: 'Employee Directory & Management', subtitle: 'Manage team members, roles, and project assignments' },
  projects: { title: 'Project Management', subtitle: 'Organize projects, budgets, and tracked hours' },
  screenshots: { title: 'Screenshot Monitoring', subtitle: 'Review visual activity, OCR text, and AI scores' },
  analytics: { title: 'Productivity Analytics', subtitle: 'Analyze team focus, idle time, and top application usage' },
  insights: { title: 'AI Insights & Performance', subtitle: 'AI narrative summaries and focus score breakdowns' },
  reports: { title: 'Reports & Export', subtitle: 'Generate daily, weekly, and monthly performance reports' },
  settings: { title: 'Admin Settings', subtitle: 'Configure platform parameters and policies' },
}

export default function AdminTopbar({
  currentTab,
  activeTrackingCount = 0,
  onOpenMobileSidebar,
}: AdminTopbarProps) {
  const info = TAB_TITLES[currentTab]

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 className="text-base font-bold text-ink dark:text-white sm:text-lg">{info.title}</h1>
          <p className="hidden text-xs text-slate-400 dark:text-slate-500 sm:block">{info.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {activeTrackingCount > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>{activeTrackingCount} Active Now</span>
          </div>
        )}

        <div className="rounded-xl bg-brand-50/80 px-3 py-1 text-xs font-extrabold text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
          PROD ADMIN
        </div>
      </div>
    </header>
  )
}
