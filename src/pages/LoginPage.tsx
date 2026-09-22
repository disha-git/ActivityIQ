import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, KeyRound, Mail, Lock, User, ArrowRight } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { api, ApiError, type ApiEmployee, type ApiUser } from '../lib/api'
import { APP_NAME } from '../lib/brand'

type View = 'landing' | 'login' | 'signup'

interface LoginPageProps {
  mode: 'login' | 'signup'
  onNavigate: (view: View) => void
  onLogin: (user: ApiUser, employee: ApiEmployee) => void
}

export default function LoginPage({ mode, onNavigate, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSignup = mode === 'signup'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { user, employee } = isSignup
        ? await api.authSignup(email, password, name || email.split('@')[0])
        : await api.authLogin(email, password)
      onLogin(user, employee)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDemo() {
    setBusy(true)
    setError(null)
    try {
      const { user, employee } = await api.authDemo()
      onLogin(user, employee)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start demo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-slate-50 px-5 py-12 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-100 via-accent-50 to-transparent blur-3xl dark:from-brand-500/10 dark:via-accent-500/5" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-[400px] rounded-2xl border border-white/60 bg-white/80 p-8 shadow-soft-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80"
      >
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-[15px] font-semibold text-ink dark:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-soft">
            <Sparkles size={16} strokeWidth={2.4} />
          </span>
          {APP_NAME}
        </button>

        <h1 className="mt-7 text-2xl font-bold tracking-tight text-ink dark:text-white">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {isSignup ? 'Start tracking in minutes.' : 'Log in to see your team dashboard.'}
        </p>

        <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
          {isSignup && (
            <Input label="Name" name="name" autoComplete="name" placeholder="Your name" icon={<User size={16} />} value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <Input label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" icon={<Mail size={16} />} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" name="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="••••••••" icon={<Lock size={16} />} value={password} onChange={(e) => setPassword(e.target.value)} />

          {!isSignup && (
            <div className="-mt-2 flex justify-end">
              <button type="button" onClick={() => onNavigate('login')} className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>
          )}

          <Button type="submit" size="lg" disabled={busy} icon={<ArrowRight size={16} />} className="flex-row-reverse">
            {isSignup ? 'Sign up' : 'Log in'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">or</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="flex flex-col gap-2.5">
          <Button variant="outline" size="lg" icon={<KeyRound size={16} />} onClick={handleDemo} disabled={busy}>
            Log in with a passkey
          </Button>
          <Button variant="secondary" size="lg" onClick={handleDemo} disabled={busy}>
            Continue with demo
          </Button>
        </div>

        <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
          {isSignup ? (
            <>Already have an account? <button type="button" onClick={() => onNavigate('login')} className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">Log in</button></>
          ) : (
            <>New to {APP_NAME}? <button type="button" onClick={() => onNavigate('signup')} className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">Sign up</button></>
          )}
        </p>
      </motion.div>
    </div>
  )
}
