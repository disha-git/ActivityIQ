import { motion } from 'framer-motion'

const BARS = [58, 72, 44, 81, 95, 63, 40]

export default function ReportsShowcase() {
  return (
    <section id="pricing" className="bg-slate-50/80 py-20 sm:py-28 dark:bg-slate-900/40">
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl dark:text-white">Reports you'll actually read</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 dark:text-slate-400">
          Weekly digests, project breakdowns, and exportable data — shareable with clients in a click.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="mx-auto mt-12 flex h-56 max-w-xl items-end justify-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-7 shadow-soft-lg dark:border-slate-800 dark:bg-slate-900 sm:h-64"
        >
          {BARS.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
              className="w-8 rounded-t-lg bg-gradient-to-t from-brand-600 to-accent-500 sm:w-10"
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
