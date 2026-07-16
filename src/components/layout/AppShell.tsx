import { type ReactNode, useState } from 'react'
import Sidebar, { type AppPage } from './Sidebar'
import Topbar from './Topbar'
import type { ApiEmployee, ApiUser } from '../../lib/api'

interface AppShellProps {
  page: AppPage
  onNavigate: (page: AppPage) => void
  user: ApiUser
  employee: ApiEmployee
  onLogout: () => void
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export default function AppShell({
  page,
  onNavigate,
  user,
  employee,
  onLogout,
  title,
  subtitle,
  actions,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-slate-50 dark:bg-slate-950">
      <Sidebar
        page={page}
        onNavigate={(next) => {
          onNavigate(next)
          setMobileOpen(false)
        }}
        user={user}
        employee={employee}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} actions={actions} onOpenMobileSidebar={() => setMobileOpen(true)} />
        {/* xl:pr reserves room for TrackerWidget, a fixed bottom-right panel (w-80) that
            otherwise overlaps content — only applied once the viewport is wide enough
            that reserving it doesn't squeeze the content column instead. */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:pr-[22rem]">{children}</main>
      </div>
    </div>
  )
}
