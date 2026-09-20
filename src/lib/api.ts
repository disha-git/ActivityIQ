export interface ApiUser {
  id: string
  email: string
  name: string
  is_admin?: number
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

// Admin API Types
export interface AdminOverviewMetrics {
  totalEmployees: number
  activeTrackingCount: number
  onlineEmployeesCount: number
  totalProjects: number
  todayHours: number
  weekHours: number
  monthHours: number
  avgFocusScore: number
  idleTimeMinutes: number
}

export interface AdminDailyTrend {
  date: string
  label: string
  hours: number
}

export interface AdminProjectDistribution {
  id: string
  name: string
  color: string
  hours: number
  employeeCount: number
}

export interface AdminRecentFeedItem {
  id: string
  employeeName: string
  employeeInitials: string
  employeeColor: string
  app: string
  url: string
  activity: number
  timestamp: string
}

export interface AdminOverviewResponse {
  metrics: AdminOverviewMetrics
  dailyTrend: AdminDailyTrend[]
  projectDistribution: AdminProjectDistribution[]
  recentFeed: AdminRecentFeedItem[]
}

export interface AdminEmployeeItem extends ApiEmployee {
  projectName: string
  userEmail: string
  isAdmin: boolean
  isTrackingNow: boolean
  todayHours: number
  weekHours: number
  focusScore: number
}

export interface AdminPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminEmployeesResponse {
  employees: AdminEmployeeItem[]
  pagination: AdminPagination
}

export interface AdminEmployeeDetailResponse {
  employee: AdminEmployeeItem
  focusScore: { score: number; trackedMinutes: number; trend: string }
  timeEntries: ApiTimeEntry[]
  topApps: UsageStat[]
  topUrls: UsageStat[]
  screenshots: {
    id: string
    capturedAt: string
    activeWindow: string | null
    productivityScore: number | null
    aiSummary: string | null
    imageUrl: string
  }[]
}

export interface AdminProjectItem extends ApiProject {
  employeeCount: number
  totalHours: number
}

export interface AdminProjectsResponse {
  projects: AdminProjectItem[]
}

export interface AdminRealtimeSession {
  entryId: string
  employeeId: string
  employeeName: string
  employeeInitials: string
  employeeColor: string
  employeeRole: string
  projectName: string
  note: string
  startedAt: string
  liveSeconds: number
  currentApp: string
  currentUrl: string
  currentActivityScore: number
  lastScreenshotAt: string | null
}

export interface AdminRealtimeResponse {
  activeSessions: AdminRealtimeSession[]
}

export interface AdminScreenshotItem {
  id: string
  employeeId: string
  employeeName: string
  employeeInitials: string
  employeeColor: string
  projectName: string
  capturedAt: string
  activeWindow: string | null
  aiSummary: string | null
  productivityScore: number | null
  ocrText: string | null
  imageUrl: string
}

export interface AdminScreenshotsResponse {
  screenshots: AdminScreenshotItem[]
  pagination: AdminPagination
}

export interface AdminAnalyticsResponse {
  range: string
  rangeLabel: string
  topApps: UsageStat[]
  topUrls: UsageStat[]
  employeeScores: {
    id: string
    name: string
    initials: string
    color: string
    focusScore: number
    trackedMinutes: number
  }[]
}

export interface AdminAiInsightsResponse {
  summary: string
  focusScore: number
  totalMinutes: number
  entryCount: number
  topApp: string
  range: string
  rangeLabel: string
}

export interface AdminReportItem {
  employeeId: string
  employeeName: string
  role: string
  projectName: string
  sessionCount: number
  totalHours: number
}

export interface AdminReportsResponse {
  range: string
  rangeLabel: string
  startDate: string
  endDate: string
  items: AdminReportItem[]
}

export interface AdminSettings {
  appName: string
  screenshotFrequencyMinutes: number
  ocrEnabled: boolean
  idleThresholdMinutes: number
  defaultRole: string
  adminEmailContact: string
}

export interface AdminSettingsResponse {
  settings: AdminSettings
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

  // Admin APIs
  adminGetOverview: () => request<AdminOverviewResponse>('/api/admin/overview'),

  adminGetEmployees: (params: {
    page?: number
    limit?: number
    search?: string
    status?: string
    projectId?: string
    role?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    if (params.projectId) query.set('projectId', params.projectId)
    if (params.role) query.set('role', params.role)
    if (params.sortBy) query.set('sortBy', params.sortBy)
    if (params.sortOrder) query.set('sortOrder', params.sortOrder)
    return request<AdminEmployeesResponse>(`/api/admin/employees?${query.toString()}`)
  },

  adminCreateEmployee: (data: {
    name: string
    role: string
    projectId: string
    email?: string
    password?: string
    isAdmin?: boolean
  }) =>
    request<{ employee: ApiEmployee }>('/api/admin/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUpdateEmployee: (
    id: string,
    data: { name: string; role: string; projectId: string; status?: string; isAdmin?: boolean },
  ) =>
    request<{ employee: ApiEmployee }>(`/api/admin/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDeleteEmployee: (id: string) =>
    request<{ ok: true }>(`/api/admin/employees/${id}`, { method: 'DELETE' }),

  adminGetEmployeeDetail: (id: string) =>
    request<AdminEmployeeDetailResponse>(`/api/admin/employees/${id}/detail`),

  adminGetProjects: () => request<AdminProjectsResponse>('/api/admin/projects'),

  adminCreateProject: (name: string, color: string) =>
    request<{ project: AdminProjectItem }>('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    }),

  adminUpdateProject: (id: string, name: string, color: string) =>
    request<{ project: AdminProjectItem }>(`/api/admin/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, color }),
    }),

  adminDeleteProject: (id: string) =>
    request<{ ok: true }>(`/api/admin/projects/${id}`, { method: 'DELETE' }),

  adminGetRealtime: () => request<AdminRealtimeResponse>('/api/admin/realtime'),

  adminGetScreenshots: (params: {
    page?: number
    limit?: number
    employeeId?: string
    projectId?: string
    search?: string
    scoreTier?: string
  }) => {
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))
    if (params.employeeId) query.set('employeeId', params.employeeId)
    if (params.projectId) query.set('projectId', params.projectId)
    if (params.search) query.set('search', params.search)
    if (params.scoreTier) query.set('scoreTier', params.scoreTier)
    return request<AdminScreenshotsResponse>(`/api/admin/screenshots?${query.toString()}`)
  },

  adminGetAnalytics: (range: string) =>
    request<AdminAnalyticsResponse>(`/api/admin/analytics?range=${range}`),

  adminGetInsights: (range: string) =>
    request<AdminAiInsightsResponse>(`/api/admin/insights?range=${range}`),

  adminGetReports: (range: string) =>
    request<AdminReportsResponse>(`/api/admin/reports?range=${range}`),

  adminGetReportsCsvUrl: (range: string) => `/api/admin/reports?range=${range}&format=csv`,

  adminGetSettings: () => request<AdminSettingsResponse>('/api/admin/settings'),

  adminUpdateSettings: (settings: Partial<AdminSettings>) =>
    request<AdminSettingsResponse>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
}

export { ApiError }

