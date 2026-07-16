import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'

export interface ScreenshotEvent {
  employeeId: string
  entryId: string
  id: string
  capturedAt: string
}

export interface ActivitySampleEvent {
  employeeId: string
  entryId: string
  app: string
  url: string
  activity: number
  durationMinutes: number
}

export interface TrackingEvent {
  employeeId: string
  entry: { id: string; started_at: string; ended_at: string | null }
}

export interface SocketHandlers {
  onScreenshot?: (payload: ScreenshotEvent) => void
  onActivitySample?: (payload: ActivitySampleEvent) => void
  onTrackingStarted?: (payload: TrackingEvent) => void
  onTrackingStopped?: (payload: TrackingEvent) => void
}

let sharedSocket: Socket | null = null

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io('http://localhost:4000', { withCredentials: true })
  }
  return sharedSocket
}

export function useSocket(handlers: SocketHandlers): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const socket = getSocket()

    const onScreenshot = (payload: ScreenshotEvent) => handlersRef.current.onScreenshot?.(payload)
    const onActivitySample = (payload: ActivitySampleEvent) => handlersRef.current.onActivitySample?.(payload)
    const onTrackingStarted = (payload: TrackingEvent) => handlersRef.current.onTrackingStarted?.(payload)
    const onTrackingStopped = (payload: TrackingEvent) => handlersRef.current.onTrackingStopped?.(payload)

    socket.on('screenshot:new', onScreenshot)
    socket.on('activity:sample', onActivitySample)
    socket.on('tracking:started', onTrackingStarted)
    socket.on('tracking:stopped', onTrackingStopped)

    return () => {
      socket.off('screenshot:new', onScreenshot)
      socket.off('activity:sample', onActivitySample)
      socket.off('tracking:started', onTrackingStarted)
      socket.off('tracking:stopped', onTrackingStopped)
    }
  }, [])
}
