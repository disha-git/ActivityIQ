import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 ${className}`}
    >
      <motion.span
        key={theme}
        initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </motion.span>
    </button>
  )
}
