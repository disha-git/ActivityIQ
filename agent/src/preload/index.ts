import { contextBridge, ipcRenderer } from 'electron'

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

const api = {
  pair: (code: string): Promise<AgentBroadcastState> => ipcRenderer.invoke('agent:pair', code),
  unpair: (): Promise<AgentBroadcastState> => ipcRenderer.invoke('agent:unpair'),
  getState: (): Promise<AgentBroadcastState> => ipcRenderer.invoke('agent:get-state'),
  getProjects: (): Promise<{ projects: AgentProject[] }> => ipcRenderer.invoke('agent:get-projects'),
  startTracking: (projectId: string, note: string): Promise<AgentBroadcastState> =>
    ipcRenderer.invoke('agent:start-tracking', projectId, note),
  stopTracking: (): Promise<AgentBroadcastState> => ipcRenderer.invoke('agent:stop-tracking'),
  onStateChange: (callback: (state: AgentBroadcastState) => void): (() => void) => {
    const listener = (_event: unknown, state: AgentBroadcastState) => callback(state)
    ipcRenderer.on('agent:state', listener)
    return () => ipcRenderer.removeListener('agent:state', listener)
  },
}

contextBridge.exposeInMainWorld('agent', api)

export type AgentApi = typeof api
