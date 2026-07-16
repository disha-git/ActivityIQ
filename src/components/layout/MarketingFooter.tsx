import { Sparkles } from 'lucide-react'
import { APP_NAME, FOOTER_LINKS } from '../../lib/brand'

function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-6.9c0-1.65-.03-3.77-2.3-3.77-2.3 0-2.65 1.8-2.65 3.65V23h-4V8z"/>
    </svg>
  )
}
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2H22l-7.5 8.57L23.4 22H16.7l-5.24-6.86L5.4 22H2.3l8.03-9.18L1.6 2h6.86l4.74 6.27L18.9 2zm-1.18 18.17h1.7L7.35 3.75h-1.8l12.17 16.42z"/>
    </svg>
  )
}
function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}

export default function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-ink dark:text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 text-white">
                <Sparkles size={14} strokeWidth={2.4} />
              </span>
              {APP_NAME}
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              AI-powered workforce analytics for teams that value clarity and trust.
            </p>
            <div className="mt-5 flex items-center gap-3 text-slate-400 dark:text-slate-500">
              <a href="#linkedin" aria-label="LinkedIn" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400"><LinkedinIcon /></a>
              <a href="#twitter" aria-label="X (Twitter)" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400"><XIcon /></a>
              <a href="#github" aria-label="GitHub" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400"><GithubIcon /></a>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-2.5 sm:grid-cols-3">
            {FOOTER_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-slate-500 transition-colors hover:text-ink dark:text-slate-400 dark:hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
