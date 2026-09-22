import { motion } from 'framer-motion'
import { ArrowRight, PlayCircle, Activity, TrendingUp } from 'lucide-react'
import Button from '../ui/Button'

interface HeroProps {
  onNavigate: (view: 'signup' | 'login') => void
}

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Background Gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-100 via-accent-50 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <Activity
              size={13}
              className="text-brand-600 dark:text-brand-400"
            />
            AI-powered workforce analytics
          </motion.div>

          {/* Heading — FIX: removed text-slate-900 so it inherits from body,
              which already switches color properly in dark mode via .dark body rule */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-5xl font-extrabold tracking-tight sm:text-7xl"
          >
            See how work
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              Actually happens
            </span>
           
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            
            className="mx-auto mt-8 max-w-3xl text-center text-xl leading-9 text-slate-500 dark:text-slate-400"
          >

            <span className="block">
              Time tracking, activity insight, and effortless screenshots
            </span>

            <span className="block">
              Built for distributed teams who want clarity without micromanagement.
            </span>
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              icon={<ArrowRight size={18} />}
              className="flex-row-reverse"
              onClick={() => onNavigate('signup')}
            >
              Start free
            </Button>

            <Button
              size="lg"
              variant="secondary"
              icon={<PlayCircle size={18} />}
              onClick={() => onNavigate('login')}
            >
              View live demo
            </Button>
          </motion.div>

          {/* <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
            No credit c
          </p> */}
        </div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
              {[
                {
                  label: 'Focus score',
                  value: '92%',
                  tone: 'text-brand-600 dark:text-brand-400',
                },
                {
                  label: 'Hours tracked',
                  value: '1,204',
                  tone: 'text-accent-600 dark:text-accent-500',
                },
                {
                  label: 'Active members',
                  value: '38',
                  tone: 'text-emerald-600 dark:text-emerald-400',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <TrendingUp size={13} />
                    {stat.label}
                  </div>

                  <div className={`mt-3 text-4xl font-bold ${stat.tone}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}