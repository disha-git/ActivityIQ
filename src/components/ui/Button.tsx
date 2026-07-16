import { motion, type HTMLMotionProps } from 'framer-motion'
import { type ReactNode, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  children?: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-soft hover:shadow-glow disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700',
  secondary:
    'bg-white text-ink border border-slate-200 shadow-soft hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800',
  outline:
    'bg-transparent text-ink border border-slate-300 hover:border-brand-400 hover:text-brand-700 dark:text-white dark:border-slate-600 dark:hover:border-brand-400 dark:hover:text-brand-400',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-2xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, className = '', children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
        {...props}
      >
        {icon}
        {children}
      </motion.button>
    )
  },
)
Button.displayName = 'Button'

export default Button
