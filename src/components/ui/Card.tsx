import { type HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glass?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, glass = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl border ${
          glass
            ? 'border-white/40 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60'
            : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
        } shadow-soft ${hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Card.displayName = 'Card'

export default Card
