import { motion } from 'framer-motion'

const TESTIMONIALS = [
  { name: 'Jordan Ellis', role: 'Head of Ops, Fluent Labs', text: 'ActivityIQ replaced three separate tools for us. The focus-score trend alone changed how we plan sprints.' },
  { name: 'Priyanka Rao', role: 'COO, Northlane', text: 'Our distributed team finally has shared visibility without anyone feeling watched. That balance is hard to get right.' },
  { name: 'Marco Silva', role: 'Founder, Driftwood Studio', text: 'Setup took ten minutes. The reports are the first analytics I actually look forward to opening.' },
]

export default function Testimonials() {
  return (
    <section className="bg-slate-50/80 py-20 sm:py-28 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl dark:text-white">Trusted by teams who value focus</h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900"
            >
              <blockquote className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-semibold text-white">
                  {t.name.split(' ').map((n) => n[0]).join('')}
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink dark:text-white">{t.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
