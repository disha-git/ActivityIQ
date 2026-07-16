import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sparkles } from 'lucide-react'
import Button from '../ui/Button'
import ThemeToggle from '../ui/ThemeToggle'
import { APP_NAME, MARKETING_NAV } from '../../lib/brand'

interface MarketingHeaderProps {
  onNavigate: (view: 'landing' | 'login' | 'signup') => void
}

export default function MarketingHeader({ onNavigate }: MarketingHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-[15px] font-semibold text-ink dark:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-soft">
            <Sparkles size={16} strokeWidth={2.4} />
          </span>
          {APP_NAME}
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {MARKETING_NAV.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-ink dark:text-slate-400 dark:hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => onNavigate('login')}>Log in</Button>
          <Button variant="primary" size="sm" onClick={() => onNavigate('signup')}>Start free</Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink dark:text-white"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {MARKETING_NAV.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="secondary" onClick={() => { setOpen(false); onNavigate('login') }}>Log in</Button>
                <Button variant="primary" onClick={() => { setOpen(false); onNavigate('signup') }}>Start free</Button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
