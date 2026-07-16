import { type ReactNode } from 'react'

type Tone = 'brand' | 'success' | 'warning' | 'neutral'

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  dot?: boolean
  className?: string
}

const TONE_CLASSES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
}

const DOT_CLASSES: Record<Tone, string> = {
  brand: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  neutral: 'bg-slate-400',
}

export default function Badge({ tone = 'neutral', children, dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`} />}
      {children}
    </span>
  )
}
