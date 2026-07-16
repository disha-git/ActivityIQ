import { motion } from 'framer-motion'

interface TabsProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  className?: string
}

export default function Tabs<T extends string>({ value, options, onChange, className = '' }: TabsProps<T>) {
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value ? 'text-ink dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {value === opt.value && (
            <motion.span
              layoutId="tabs-active-pill"
              className="absolute inset-0 rounded-lg bg-white shadow-soft dark:bg-slate-700"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
