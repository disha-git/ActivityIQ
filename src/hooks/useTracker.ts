import { useEffect, useRef, useState } from 'react'
import { api, ApiError, type ApiProject } from '../lib/api'

export function useTracker(projects: ApiProject[], onEntryStopped: () => void) {
  const [entryId, setEntryId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [note, setNote] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    api
      .getActiveTracking()
      .then(({ entry }) => {
        if (entry) {
          setEntryId(entry.id)
          setProjectId(entry.project_id)
          setNote(entry.note)
          setElapsed(entry.liveSeconds ?? 0)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!entryId) return
    tickRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [entryId])

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id)
  }, [projects, projectId])

  async function start() {
    if (!projectId) return
    setBusy(true)
    setError(null)
    try {
      const { entry } = await api.startTracking(projectId, note)
      setEntryId(entry.id)
      setElapsed(0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start tracking.')
    } finally {
      setBusy(false)
    }
  }

  async function stop() {
    if (!entryId) return
    setBusy(true)
    setError(null)
    try {
      await api.stopTracking(entryId)
      setEntryId(null)
      setElapsed(0)
      setNote('')
      onEntryStopped()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not stop tracking.')
    } finally {
      setBusy(false)
    }
  }

  return {
    entryId,
    isTracking: Boolean(entryId),
    projectId,
    setProjectId,
    note,
    setNote,
    elapsed,
    busy,
    error,
    start,
    stop,
  }
}
