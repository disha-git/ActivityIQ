export interface AgentBroadcastState {
  tracking: boolean
  entryId: string | null
  projectId: string | null
  employeeName: string | null
  paired: boolean
}

export interface AgentProject {
  id: string
  name: string
  color: string
}

export interface AgentApi {
  pair: (code: string) => Promise<AgentBroadcastState>
  unpair: () => Promise<AgentBroadcastState>
  getState: () => Promise<AgentBroadcastState>
  getProjects: () => Promise<{ projects: AgentProject[] }>
  startTracking: (projectId: string, note: string) => Promise<AgentBroadcastState>
  stopTracking: () => Promise<AgentBroadcastState>
  onStateChange: (callback: (state: AgentBroadcastState) => void) => () => void
}

declare global {
  interface Window {
    agent: AgentApi
  }
}
