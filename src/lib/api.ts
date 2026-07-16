export interface ApiUser {
  id: string
  email: string
  name: string
}

export interface ApiEmployee {
  id: string
  user_id: string | null
  name: string
  role: string
  initials: string
  color: string
  project_id: string
  status: 'online' | 'offline'
  created_at: string
  isYou?: boolean
  todaySeconds?: number
  weekSeconds?: number
  monthSeconds?: number
}

export interface ApiProject {
  id: string
  name: string
  color: string
}

export interface ApiTimeEntry {
  id: string
  employee_id: string
  project_id: string
  note: string
  started_at: string
  ended_at: string | null
  seconds: number
  liveSeconds?: number
}

export interface TimelineEntry {
  id: string
  time: string
  durationMinutes: number
  activity: number
  app: string
  url: string
  isLive: boolean
}

export interface UsageStat {
  name: string
  minutes: number
}

export interface TimelineScreenshot {
  id: string
  capturedAt: string
  imageUrl: string | null
}

export interface TimelineResponse {
  entries: TimelineEntry[]
  appUsage: UsageStat[]
  urlUsage: UsageStat[]
  screenshots: TimelineScreenshot[]
}

export interface AiSummaryResponse {
  summary: string
  focusScore: number
  totalMinutes: number
  topProject: string | null
  topApp: string | null
  entryCount: number
  range: string
  rangeLabel: string
}

class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`)
  }
  return data as T
}

export const api = {
  authDemo: () => request<{ user: ApiUser; employee: ApiEmployee }>('/api/auth/demo', { method: 'POST' }),
  authSignup: (email: string, password: string, name: string) =>
    request<{ user: ApiUser; employee: ApiEmployee }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  authLogin: (email: string, password: string) =>
    request<{ user: ApiUser; employee: ApiEmployee }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  authLogout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  authMe: () => request<{ user: ApiUser; employee: ApiEmployee }>('/api/auth/me'),

  getProjects: () => request<{ projects: ApiProject[] }>('/api/projects'),
  createProject: (name: string, color: string) =>
    request<{ project: ApiProject }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    }),

  getEmployees: () => request<{ employees: ApiEmployee[] }>('/api/employees'),
  inviteEmployee: (name: string, role: string, projectId: string) =>
    request<{ employee: ApiEmployee }>('/api/employees', {
      method: 'POST',
      body: JSON.stringify({ name, role, projectId }),
    }),

  getTimeline: (employeeId: string, range: string) =>
    request<TimelineResponse>(`/api/tracking/timeline/${employeeId}?range=${range}`),

  startTracking: (projectId: string, note: string) =>
    request<{ entry: ApiTimeEntry }>('/api/tracking/start', {
      method: 'POST',
      body: JSON.stringify({ projectId, note }),
    }),

  stopTracking: (entryId: string) =>
    request<{ entry: ApiTimeEntry }>('/api/tracking/stop', {
      method: 'POST',
      body: JSON.stringify({ entryId }),
    }),

  getActiveTracking: () => request<{ entry: ApiTimeEntry | null }>('/api/tracking/active'),

  getAgentPairingCode: () =>
    request<{ code: string; expiresAt: string }>('/api/auth/agent-pairing-code', { method: 'POST' }),

  getAiSummary: (employeeId: string, range: string) =>
    request<AiSummaryResponse>(`/api/ai/summary/${employeeId}?range=${range}`),
}

export { ApiError }
