import { io, type Socket } from 'socket.io-client'
import { getConfig } from '../config'
import { log } from '../logger'

let socket: Socket | null = null

export function connectSocket(): Socket | null {
  const config = getConfig()
  if (!config.token) return null
  if (socket?.connected) return socket

  socket = io(config.socketUrl, { auth: { token: config.token }, reconnection: true })
  socket.on('connect', () => log.info('[socketClient] connected'))
  socket.on('disconnect', (reason) => log.warn('[socketClient] disconnected', reason))
  socket.on('connect_error', (err) => log.warn('[socketClient] connect_error', err.message))
  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}

export function emitTrackingStarted(entryId: string, projectId: string): void {
  socket?.emit('tracking:started', { entryId, projectId })
}

export function emitTrackingStopped(entryId: string): void {
  socket?.emit('tracking:stopped', { entryId })
}

export function emitActivitySample(payload: { entryId: string; app: string; activity: number }): void {
  socket?.emit('activity:sample', payload)
}
