import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <label className="flex flex-col gap-1.5" htmlFor={inputId}>
        {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`h-11 w-full rounded-xl border bg-white text-[15px] text-ink placeholder:text-slate-400 outline-none transition-colors dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 ${
              icon ? 'pl-10 pr-3.5' : 'px-3.5'
            } ${
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50 dark:border-red-500/50 dark:focus:ring-red-500/10'
                : 'border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 dark:border-slate-700 dark:focus:ring-brand-500/10'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs font-medium text-red-600 dark:text-red-400">{error}</span>}
      </label>
    )
  },
)
Input.displayName = 'Input'

export default Input
