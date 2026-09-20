import { lazy, Suspense, useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import type { AppPage } from './components/layout/Sidebar'
import TrackerWidget from './components/tracker/TrackerWidget'
import { api, type ApiEmployee, type ApiProject, type ApiUser } from './lib/api'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

function AppLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-white text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
      Loading…
    </div>
  )
}

type View = 'landing' | 'login' | 'signup' | 'app' | 'admin'

function App() {
  const [view, setView] = useState<View>('landing')
  const [page, setPage] = useState<AppPage>('dashboard')
  const [user, setUser] = useState<ApiUser | null>(null)
  const [employee, setEmployee] = useState<ApiEmployee | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [refreshSignal, setRefreshSignal] = useState(0)

  useEffect(() => {
    api
      .authMe()
      .then(({ user, employee }) => {
        setUser(user)
        setEmployee(employee)
        const isAdmin = user.is_admin === 1
        setView(isAdmin ? 'admin' : 'app')
      })
      .catch(() => {})
      .finally(() => setCheckingSession(false))
  }, [])

  function loadProjects() {
    api.getProjects().then(({ projects }) => setProjects(projects)).catch(() => {})
  }

  useEffect(() => {
    if (view === 'app' || view === 'admin') loadProjects()
  }, [view])

  function handleNavigate(next: 'landing' | 'login' | 'signup') {
    setView(next)
    window.scrollTo({ top: 0 })
  }

  function handleLogin(loggedInUser: ApiUser, loggedInEmployee: ApiEmployee) {
    setUser(loggedInUser)
    setEmployee(loggedInEmployee)
    const isAdmin = loggedInUser.is_admin === 1
    setView(isAdmin ? 'admin' : 'app')
  }

  async function handleLogout() {
    await api.authLogout().catch(() => {})
    setUser(null)
    setEmployee(null)
    setView('landing')
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Loading ActivityIQ…
      </div>
    )
  }

  if (view === 'admin' && user && employee) {
    return (
      <Suspense fallback={<AppLoading />}>
        <AdminPage
          user={user}
          employee={employee}
          onReturnToUserDashboard={() => setView('app')}
          onLogout={handleLogout}
        />
      </Suspense>
    )
  }

  if (view === 'app' && user && employee) {
    return (
      <Suspense fallback={<AppLoading />}>
        {page === 'dashboard' && (
          <DashboardPage
            user={user}
            employee={employee}
            projects={projects}
            onNavigate={setPage}
            onLogout={handleLogout}
            refreshSignal={refreshSignal}
          />
        )}
        {page === 'reports' && (
          <ReportsPage
            user={user}
            employee={employee}
            projects={projects}
            onNavigate={setPage}
            onLogout={handleLogout}
          />
        )}
        {page === 'settings' && (
          <SettingsPage
            user={user}
            employee={employee}
            projects={projects}
            onNavigate={setPage}
            onLogout={handleLogout}
            onProjectsChanged={loadProjects}
          />
        )}
        {projects.length > 0 && (
          <TrackerWidget projects={projects} onEntryStopped={() => setRefreshSignal((n) => n + 1)} />
        )}
      </Suspense>
    )
  }

  if (view === 'login' || view === 'signup') {
    return <LoginPage mode={view} onNavigate={handleNavigate} onLogin={handleLogin} />
  }

  return <LandingPage onNavigate={handleNavigate} />
}

export default App
