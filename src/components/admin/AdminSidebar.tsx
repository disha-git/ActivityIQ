import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Radio,
  Users,
  Briefcase,
  Camera,
  LineChart,
  Sparkles,
  FileSpreadsheet,
  Settings,
  LogOut,
  ArrowLeft,
  X,
  ShieldCheck,
} from 'lucide-react'
import Avatar from '../ui/Avatar'
import ThemeToggle from '../ui/ThemeToggle'
import type { ApiEmployee, ApiUser } from '../../lib/api'

export type AdminTab =
  | 'overview'
  | 'monitoring'
  | 'employees'
  | 'projects'
  | 'screenshots'
  | 'analytics'
  | 'insights'
  | 'reports'
  | 'settings'

interface AdminSidebarProps {
  currentTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  user: ApiUser
  employee: ApiEmployee
  activeOnlineCount?: number
  onReturnToUserDashboard: () => void
  onLogout: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

const NAV_ITEMS: { tab: AdminTab; label: string; icon: typeof LayoutDashboard; badge?: string }[] = [
  { tab: 'overview', label: 'Overview', icon: LayoutDashboard },
  { tab: 'monitoring', label: 'Real-time Pulse', icon: Radio },
  { tab: 'employees', label: 'Employees', icon: Users },
  { tab: 'projects', label: 'Projects', icon: Briefcase },
  { tab: 'screenshots', label: 'Screenshots', icon: Camera },
  { tab: 'analytics', label: 'Analytics', icon: LineChart },
  { tab: 'insights', label: 'AI Insights', icon: Sparkles },
  { tab: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { tab: 'settings', label: 'Settings', icon: Settings },
]

function SidebarContent({
  currentTab,
  onSelectTab,
  user,
  employee,
  activeOnlineCount,
  onReturnToUserDashboard,
  onLogout,
  onCloseMobile,
}: Omit<AdminSidebarProps, 'mobileOpen'>) {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-slate-900">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-soft">
            <ShieldCheck size={20} strokeWidth={2.2} />
          </span>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-white">
              <span>ActivityIQ</span>
              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-brand-600 uppercase dark:bg-brand-500/20 dark:text-brand-300">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Enterprise Control Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = currentTab === item.tab
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => {
                onSelectTab(item.tab)
                onCloseMobile?.()
              }}
              className={`relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-slate-500 hover:bg-slate-100/80 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="admin-sidebar-active"
                  className="absolute inset-0 rounded-xl bg-brand-50 dark:bg-brand-500/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative flex items-center gap-3">
                <item.icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </div>

              {item.tab === 'monitoring' && typeof activeOnlineCount === 'number' && activeOnlineCount > 0 && (
                <span className="relative flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeOnlineCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer / Switch View */}
      <div className="border-t border-slate-200/80 p-3 space-y-2 dark:border-slate-800">
        <button
          type="button"
          onClick={onReturnToUserDashboard}
          className="flex w-full items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={15} /> Exit Admin to Dashboard
        </button>

        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <Avatar initials={employee.initials} color={employee.color} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-ink dark:text-white">{user.name}</div>
            <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-rose-600 dark:hover:bg-slate-800"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSidebar(props: AdminSidebarProps) {
  return (
    <>
      <aside className="sticky top-0 hidden h-svh w-64 flex-shrink-0 border-r border-slate-200/80 bg-white lg:block dark:border-slate-800 dark:bg-slate-950">
        <SidebarContent {...props} />
      </aside>

      <AnimatePresence>
        {props.mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={props.onCloseMobile}
              className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-soft-lg lg:hidden dark:bg-slate-950"
            >
              <SidebarContent {...props} onCloseMobile={props.onCloseMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
