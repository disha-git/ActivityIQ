import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import Button from '../ui/Button'

interface HowItWorksProps {
  onNavigate: (view: 'login') => void
}

export default function HowItWorks({ onNavigate }: HowItWorksProps) {
  return (
    <section id="docs" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl dark:text-white">How it works</h2>
      </div>

      <div className="mt-14 flex flex-col items-center gap-16">
        <div className="flex w-full flex-col items-center gap-10 lg:flex-row">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45 }}
            className="flex-1"
          >
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-ink to-slate-800 p-8 shadow-soft-lg">
              <div className="h-2 w-2/3 rounded-full bg-white/15" />
              <div className="mt-9 font-mono text-3xl font-bold tabular-nums text-white">00:42:18</div>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Recording
              </div>
            </div>
          </motion.div>
          <div className="flex-1">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
            <h3 className="mt-4 text-xl font-semibold text-ink dark:text-white">Your team tracks time in one click</h3>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
              A lightweight desktop tracker lets people pick a project, add a note, and press start.
              Data streams to ActivityIQ in real time until they stop.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-10 lg:flex-row-reverse">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45 }}
            className="flex-1"
          >
            <div className="grid grid-cols-3 gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-lg dark:border-slate-800 dark:bg-slate-900">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-xl bg-gradient-to-br from-brand-100 to-accent-50 dark:from-brand-500/15 dark:to-accent-500/10" />
              ))}
            </div>
          </motion.div>
          <div className="flex-1">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white">2</span>
            <h3 className="mt-4 text-xl font-semibold text-ink dark:text-white">Managers see clear, AI-scored insight</h3>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
              Focus scores, app and site breakdowns, and optional screenshots — all summarized so
              you spend minutes reviewing, not hours.
            </p>
            <Button variant="secondary" size="sm" icon={<Play size={14} />} className="mt-4" onClick={() => onNavigate('login')}>
              See demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
