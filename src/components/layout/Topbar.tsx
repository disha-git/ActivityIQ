import { type ReactNode } from 'react'
import { Menu } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: ReactNode
  onOpenMobileSidebar: () => void
  actions?: ReactNode
}

export default function Topbar({ title, subtitle, onOpenMobileSidebar, actions }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/85 px-4 py-3.5 backdrop-blur-xl sm:px-6 dark:border-slate-800 dark:bg-slate-950/85">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Open menu"
      >
        <Menu size={19} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-semibold text-ink dark:text-white">{title}</h1>
        {subtitle && <div className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>}
      </div>

      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
