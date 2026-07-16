import { motion } from 'framer-motion'
import { MonitorSmartphone, Brain, LineChart } from 'lucide-react'
import Button from '../ui/Button'

const FEATURES = [
  {
    icon: MonitorSmartphone,
    title: 'Effortless tracking',
    text: 'A lightweight desktop tracker your team actually likes using. One click to start, one to stop.',
  },
  {
    icon: Brain,
    title: 'AI-powered insights',
    text: 'Automatic focus scoring, app and site breakdowns, and anomaly detection — no manual review needed.',
  },
  {
    icon: LineChart,
    title: 'Actionable reports',
    text: 'Clean, shareable reports on time, projects, and productivity trends across your whole org.',
  },
]

interface FeatureGridProps {
  onNavigate: (view: 'signup') => void
}

export default function FeatureGrid({ onNavigate }: FeatureGridProps) {
  return (
    <section id="product" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl dark:text-white">Built for how modern teams actually work</h2>
        <p className="mt-4 text-base text-slate-500 dark:text-slate-400">
          No keylogging. No surveillance theater. Just clear, ethical visibility into where time goes.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 text-brand-600 transition-transform duration-200 group-hover:scale-105 dark:from-brand-500/10 dark:to-accent-500/10 dark:text-brand-400">
              <feature.icon size={22} strokeWidth={1.8} />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink dark:text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{feature.text}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Button variant="secondary" onClick={() => onNavigate('signup')}>See pricing</Button>
      </div>
    </section>
  )
}
