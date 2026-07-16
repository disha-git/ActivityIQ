import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { apiClient, type ActivitySamplePayload } from './apiClient'
import { log } from '../logger'

/**
 * The queue is persisted as JSON, and a Buffer cannot survive JSON.stringify —
 * so a queued screenshot parks its bytes as base64 and they are rebuilt into a
 * Buffer at flush time. The upload is always multipart bytes either way.
 */
type QueueItem =
  | { kind: 'activity'; payload: ActivitySamplePayload }
  | {
      kind: 'screenshot'
      payload: {
        entryId: string
        imageBase64: string
        mimeType: string
        activeWindow?: string
        capturedAt?: string
      }
    }

interface QueueState {
  items: QueueItem[]
}

function queuePath(): string {
  return path.join(app.getPath('userData'), 'sync-queue.json')
}

function readQueue(): QueueState {
  try {
    return JSON.parse(fs.readFileSync(queuePath(), 'utf8'))
  } catch {
    return { items: [] }
  }
}

function writeQueue(state: QueueState): void {
  fs.mkdirSync(path.dirname(queuePath()), { recursive: true })
  fs.writeFileSync(queuePath(), JSON.stringify(state), 'utf8')
}

export function enqueue(item: QueueItem): void {
  const state = readQueue()
  state.items.push(item)
  writeQueue(state)
}

let flushing = false

export async function flushQueue(): Promise<void> {
  if (flushing) return
  flushing = true
  try {
    const state = readQueue()
    if (state.items.length === 0) return
    const remaining: QueueItem[] = []
    for (const item of state.items) {
      try {
        if (item.kind === 'activity') {
          await apiClient.postActivity(item.payload)
        } else {
          await apiClient.postScreenshot({
            entryId: item.payload.entryId,
            buffer: Buffer.from(item.payload.imageBase64, 'base64'),
            mimeType: item.payload.mimeType ?? 'image/jpeg',
            activeWindow: item.payload.activeWindow,
            capturedAt: item.payload.capturedAt,
          })
        }
      } catch (err) {
        log.warn('[syncQueue] item failed, keeping for retry', err)
        remaining.push(item)
      }
    }
    writeQueue({ items: remaining })
  } finally {
    flushing = false
  }
}

export function queueLength(): number {
  return readQueue().items.length
}
