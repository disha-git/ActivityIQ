import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, BarChart3, Settings, LogOut, Sparkles, X } from 'lucide-react'
import Avatar from '../ui/Avatar'
import ThemeToggle from '../ui/ThemeToggle'
import { APP_NAME } from '../../lib/brand'
import type { ApiEmployee, ApiUser } from '../../lib/api'

export type AppPage = 'dashboard' | 'reports' | 'settings'

interface SidebarProps {
  page: AppPage
  onNavigate: (page: AppPage) => void
  user: ApiUser
  employee: ApiEmployee
  onLogout: () => void
  onOpenAdmin?: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

const NAV_ITEMS: { page: AppPage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'reports', label: 'Reports', icon: BarChart3 },
  { page: 'settings', label: 'Settings', icon: Settings },
]

function SidebarContent({
  page,
  onNavigate,
  user,
  employee,
  onLogout,
  onOpenAdmin,
  onCloseMobile,
}: Omit<SidebarProps, 'mobileOpen'> & { onCloseMobile?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-ink dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-soft">
            <Sparkles size={16} strokeWidth={2.4} />
          </span>
          {APP_NAME}
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = page === item.page
          return (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(item.page)}
              className={`relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-brand-50 dark:bg-brand-500/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <item.icon size={17} className="relative" strokeWidth={2} />
              <span className="relative">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-800 space-y-1">
        {user.is_admin === 1 && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="flex w-full items-center gap-2.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
          >
            <Sparkles size={15} /> Switch to Admin Panel
          </button>
        )}
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <Avatar initials={employee.initials} color={employee.color} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink dark:text-white">{user.name}</div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  )
}

export default function Sidebar(props: SidebarProps) {
  return (
    <>
      <aside className="sticky top-0 hidden h-svh w-64 flex-shrink-0 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-950">
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
              className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden"
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
