import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import { APP_NAME } from '../../lib/brand'

interface CtaBandProps {
  onNavigate: (view: 'signup') => void
}

export default function CtaBand({ onNavigate }: CtaBandProps) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-slate-900 to-brand-900/60 px-8 py-16 text-center shadow-soft-lg sm:px-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-600/25 blur-3xl" />
        <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Start seeing your team's real productivity
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-slate-300">
          Set up {APP_NAME} in minutes. No credit card required, cancel anytime.
        </p>
        <div className="relative mt-8 flex justify-center">
          <Button size="lg" icon={<ArrowRight size={17} />} className="flex-row-reverse" onClick={() => onNavigate('signup')}>
            Start free
          </Button>
        </div>
      </div>
    </section>
  )
}
