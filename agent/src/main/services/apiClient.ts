import { getConfig } from '../config'

export interface AgentEmployee {
  id: string
  name: string
  initials: string
  color: string
  role: string
}

export interface AgentProject {
  id: string
  name: string
  color: string
}

export interface AgentTimeEntry {
  id: string
  employee_id: string
  project_id: string
  started_at: string
  ended_at: string | null
}

export interface ActivitySamplePayload {
  entryId: string
  projectId: string
  app: string
  url: string
  activity: number
  durationMinutes: number
  idleSeconds?: number
}

async function agentFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const config = getConfig()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  }
  if (config.token) headers.Authorization = `Bearer ${config.token}`

  const res = await fetch(`${config.apiBaseUrl}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`)
  }
  return data as T
}

export const apiClient = {
  pair: (code: string) =>
    agentFetch<{ token: string; employee: AgentEmployee }>('/api/agent/pair', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  heartbeat: () => agentFetch<{ ok: boolean }>('/api/agent/heartbeat', { method: 'POST' }),

  getProjects: () => agentFetch<{ projects: AgentProject[] }>('/api/agent/projects'),

  startTracking: (projectId: string, note = '') =>
    agentFetch<{ entry: AgentTimeEntry }>('/api/agent/tracking/start', {
      method: 'POST',
      body: JSON.stringify({ projectId, note }),
    }),

  stopTracking: (entryId: string) =>
    agentFetch<{ entry: AgentTimeEntry }>('/api/agent/tracking/stop', {
      method: 'POST',
      body: JSON.stringify({ entryId }),
    }),

  postActivity: (payload: ActivitySamplePayload) =>
    agentFetch<{ ok: boolean }>('/api/agent/activity', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  postScreenshot: (payload: ScreenshotPayload) => postScreenshotMultipart(payload),
}

export interface ScreenshotPayload {
  entryId: string
  /** Raw JPEG bytes. Uploaded as-is; never written to disk. */
  buffer: Buffer
  mimeType: string
  activeWindow?: string
  capturedAt?: string
  productivityScore?: number
}

/**
 * Uploads the screenshot as multipart/form-data to POST /api/screenshots, where
 * it is stored in a MySQL LONGBLOB. Cannot go through agentFetch: that forces
 * Content-Type: application/json, and multipart needs fetch to generate its own
 * Content-Type with the boundary parameter.
 */
async function postScreenshotMultipart(
  payload: ScreenshotPayload,
): Promise<{ id: string; imageUrl: string; bytes: number }> {
  const config = getConfig()

  const form = new FormData()
  form.append('image', new Blob([payload.buffer], { type: payload.mimeType }), 'screenshot.jpg')
  form.append('entryId', payload.entryId)
  form.append('capturedAt', payload.capturedAt ?? new Date().toISOString())
  if (payload.activeWindow) form.append('activeWindow', payload.activeWindow)
  if (payload.productivityScore !== undefined) {
    form.append('productivityScore', String(payload.productivityScore))
  }

  const headers: Record<string, string> = {}
  if (config.token) headers.Authorization = `Bearer ${config.token}`

  const res = await fetch(`${config.apiBaseUrl}/api/screenshots`, { method: 'POST', headers, body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Screenshot upload failed (${res.status})`)
  }
  return data as { id: string; imageUrl: string; bytes: number }
}
