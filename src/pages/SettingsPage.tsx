import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, FolderPlus, Mail, Monitor } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import type { AppPage } from '../components/layout/Sidebar'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useEmployees } from '../hooks/useEmployees'
import { api, ApiError, type ApiEmployee, type ApiProject, type ApiUser } from '../lib/api'

interface SettingsPageProps {
  user: ApiUser
  employee: ApiEmployee
  projects: ApiProject[]
  onNavigate: (page: AppPage) => void
  onLogout: () => void
  onProjectsChanged: () => void
}

const PROJECT_COLORS = ['#2563eb', '#4f46e5', '#f59e0b', '#e0578c', '#10b981']

export default function SettingsPage({ user, employee, projects, onNavigate, onLogout, onProjectsChanged }: SettingsPageProps) {
  const [teamRefresh, setTeamRefresh] = useState(0)
  const { employees } = useEmployees(teamRefresh)

  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0])
  const [projectBusy, setProjectBusy] = useState(false)
  const [projectError, setProjectError] = useState<string | null>(null)
  const [projectDone, setProjectDone] = useState(false)

  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteProjectId, setInviteProjectId] = useState(projects[0]?.id ?? '')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteDone, setInviteDone] = useState(false)

  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingExpiresAt, setPairingExpiresAt] = useState<string | null>(null)
  const [pairingBusy, setPairingBusy] = useState(false)
  const [pairingError, setPairingError] = useState<string | null>(null)

  async function handleGeneratePairingCode() {
    setPairingBusy(true)
    setPairingError(null)
    try {
      const { code, expiresAt } = await api.getAgentPairingCode()
      setPairingCode(code)
      setPairingExpiresAt(expiresAt)
    } catch (err) {
      setPairingError(err instanceof ApiError ? err.message : 'Could not generate a pairing code.')
    } finally {
      setPairingBusy(false)
    }
  }

  async function handleCreateProject(e: FormEvent) {
    e.preventDefault()
    if (!projectName.trim()) return
    setProjectBusy(true)
    setProjectError(null)
    setProjectDone(false)
    try {
      await api.createProject(projectName.trim(), projectColor)
      setProjectName('')
      setProjectDone(true)
      onProjectsChanged()
    } catch (err) {
      setProjectError(err instanceof ApiError ? err.message : 'Could not create project.')
    } finally {
      setProjectBusy(false)
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    if (!inviteName.trim() || !inviteProjectId) return
    setInviteBusy(true)
    setInviteError(null)
    setInviteDone(false)
    try {
      await api.inviteEmployee(inviteName.trim(), inviteRole.trim() || 'Team Member', inviteProjectId)
      setInviteName('')
      setInviteRole('')
      setInviteDone(true)
      setTeamRefresh((n) => n + 1)
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : 'Could not send invite.')
    } finally {
      setInviteBusy(false)
    }
  }

  return (
    <AppShell page="settings" onNavigate={onNavigate} user={user} employee={employee} onLogout={onLogout} title="Settings">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink dark:text-white">Profile</h2>
          <div className="flex items-center gap-4">
            <Avatar initials={employee.initials} color={employee.color} size={48} />
            <div>
              <div className="text-base font-semibold text-ink dark:text-white">{user.name}</div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Mail size={13} /> {user.email}
              </div>
            </div>
            <Badge tone="brand" className="ml-auto">{employee.role}</Badge>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
            <FolderPlus size={15} /> Projects
          </h2>

          <div className="mb-5 flex flex-wrap gap-2">
            {projects.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                {p.name}
              </span>
            ))}
          </div>

          <form onSubmit={handleCreateProject} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="New project name"
                name="project-name"
                placeholder="e.g. Marketing Site"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setProjectColor(c)}
                  aria-label={`Color ${c}`}
                  className={`h-7 w-7 rounded-full transition-transform ${projectColor === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <Button type="submit" disabled={projectBusy || !projectName.trim()}>Add project</Button>
          </form>
          {projectError && <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{projectError}</p>}
          {projectDone && !projectError && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Project created.
            </motion.p>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
            <Monitor size={15} /> Desktop Agent
          </h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Generate a one-time code and enter it into the ActivityIQ Agent desktop app to link this account for
            automatic time, activity, and screenshot tracking.
          </p>
          <Button type="button" onClick={handleGeneratePairingCode} disabled={pairingBusy}>
            {pairingBusy ? 'Generating…' : 'Generate pairing code'}
          </Button>
          {pairingCode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="font-mono text-2xl font-bold tracking-widest text-ink dark:text-white">{pairingCode}</div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Expires at {pairingExpiresAt ? new Date(pairingExpiresAt).toLocaleTimeString() : ''}. Single use.
              </p>
            </motion.div>
          )}
          {pairingError && <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{pairingError}</p>}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
            <UserPlus size={15} /> Team
          </h2>

          <div className="mb-5 space-y-2">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                <Avatar initials={emp.initials} color={emp.color} status={emp.status} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink dark:text-white">{emp.name}</div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{emp.role}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleInvite} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label="Name" name="invite-name" placeholder="Jamie Fox" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            <Input label="Role" name="invite-role" placeholder="Engineer" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} />
            <Select label="Project" name="invite-project" value={inviteProjectId} onChange={(e) => setInviteProjectId(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <Button type="submit" className="sm:col-span-3" disabled={inviteBusy || !inviteName.trim()}>
              Send invite
            </Button>
          </form>
          {inviteError && <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{inviteError}</p>}
          {inviteDone && !inviteError && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Invite sent.
            </motion.p>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
