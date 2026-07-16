import { ChevronDown } from 'lucide-react'
import { type ReactNode, type SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className = '', id, children, ...props }, ref) => {
    const selectId = id ?? props.name
    return (
      <label className="flex flex-col gap-1.5" htmlFor={selectId}>
        {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-[15px] text-ink outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-brand-500/10 ${className}`}
            {...props}
          >
            {children}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        </div>
      </label>
    )
  },
)
Select.displayName = 'Select'

export default Select
