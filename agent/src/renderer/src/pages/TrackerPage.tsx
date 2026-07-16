import { useEffect, useState } from 'react'
import type { AgentBroadcastState, AgentProject } from '../agentTypes'

interface Props {
  state: AgentBroadcastState
}

export default function TrackerPage({ state }: Props) {
  const [projects, setProjects] = useState<AgentProject[]>([])
  const [selectedProject, setSelectedProject] = useState(state.projectId ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [local, setLocal] = useState(state)

  useEffect(() => {
    window.agent.getProjects().then(({ projects }) => {
      setProjects(projects)
      setSelectedProject((current) => current || projects[0]?.id || '')
    })
  }, [])

  useEffect(() => {
    const unsubscribe = window.agent.onStateChange(setLocal)
    return unsubscribe
  }, [])

  async function toggleTracking() {
    setBusy(true)
    setError(null)
    try {
      if (local.tracking) {
        await window.agent.stopTracking()
      } else if (selectedProject) {
        await window.agent.startTracking(selectedProject, '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function unpair() {
    await window.agent.unpair()
  }

  return (
    <div className="screen tracker-page">
      <h1>ActivityIQ Agent</h1>
      <p className="hint">Signed in as {local.employeeName}</p>

      <select
        value={selectedProject}
        onChange={(e) => setSelectedProject(e.target.value)}
        disabled={local.tracking || projects.length === 0}
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        className={local.tracking ? 'stop' : 'start'}
        onClick={toggleTracking}
        disabled={busy || (!local.tracking && !selectedProject)}
      >
        {local.tracking ? 'Stop tracking' : 'Start tracking'}
      </button>

      {error && <p className="error">{error}</p>}

      <button className="link" onClick={unpair}>
        Unpair this device
      </button>
    </div>
  )
}
