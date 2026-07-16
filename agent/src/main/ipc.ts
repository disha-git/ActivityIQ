import { EventEmitter } from 'node:events'
import { ipcMain } from 'electron'
import { apiClient } from './services/apiClient'
import { getConfig, updateConfig, clearPairing } from './config'
import { connectSocket, disconnectSocket, emitTrackingStarted, emitTrackingStopped } from './services/socketClient'
import { flushQueue } from './services/syncQueue'
import { log } from './logger'

export interface TrackingState {
  tracking: boolean
  entryId: string | null
  projectId: string | null
}

export interface BroadcastState extends TrackingState {
  employeeName: string | null
  paired: boolean
}

const trackingState: TrackingState = { tracking: false, entryId: null, projectId: null }

export const stateEvents = new EventEmitter()

export function getTrackingState(): TrackingState {
  return trackingState
}

export function getBroadcastState(): BroadcastState {
  const config = getConfig()
  return { ...trackingState, employeeName: config.employeeName, paired: Boolean(config.token) }
}

function emitStateChanged(): void {
  stateEvents.emit('state-changed', getBroadcastState())
}

export async function pairFlow(code: string): Promise<BroadcastState> {
  const { token, employee } = await apiClient.pair(code)
  updateConfig({ token, employeeId: employee.id, employeeName: employee.name })
  connectSocket()
  flushQueue().catch((err) => log.warn('[ipc] flush after pair failed', err))
  emitStateChanged()
  return getBroadcastState()
}

export function unpairFlow(): BroadcastState {
  if (trackingState.tracking && trackingState.entryId) {
    apiClient.stopTracking(trackingState.entryId).catch((err) => log.warn('[ipc] stop-on-unpair failed', err))
  }
  trackingState.tracking = false
  trackingState.entryId = null
  trackingState.projectId = null
  disconnectSocket()
  clearPairing()
  emitStateChanged()
  return getBroadcastState()
}

export async function startTrackingFlow(projectId: string, note: string): Promise<BroadcastState> {
  const { entry } = await apiClient.startTracking(projectId, note)
  trackingState.tracking = true
  trackingState.entryId = entry.id
  trackingState.projectId = projectId
  updateConfig({ activeEntryId: entry.id, activeProjectId: projectId })
  emitTrackingStarted(entry.id, projectId)
  emitStateChanged()
  return getBroadcastState()
}

export async function stopTrackingFlow(): Promise<BroadcastState> {
  if (!trackingState.entryId) return getBroadcastState()
  const entryId = trackingState.entryId
  await apiClient.stopTracking(entryId)
  trackingState.tracking = false
  trackingState.entryId = null
  trackingState.projectId = null
  updateConfig({ activeEntryId: null, activeProjectId: null })
  emitTrackingStopped(entryId)
  emitStateChanged()
  return getBroadcastState()
}

export function registerIpcHandlers(): void {
  ipcMain.handle('agent:pair', (_e, code: string) => pairFlow(code))
  ipcMain.handle('agent:unpair', () => unpairFlow())
  ipcMain.handle('agent:get-state', () => getBroadcastState())
  ipcMain.handle('agent:get-projects', () => apiClient.getProjects())
  ipcMain.handle('agent:start-tracking', (_e, projectId: string, note: string) => startTrackingFlow(projectId, note))
  ipcMain.handle('agent:stop-tracking', () => stopTrackingFlow())
}
