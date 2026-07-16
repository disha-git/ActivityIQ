import { activeWindow } from 'active-win'
import { log } from '../logger'

export interface ActiveWindowInfo {
  app: string
  url: string
}

export async function getActiveWindowInfo(): Promise<ActiveWindowInfo> {
  try {
    const result = await activeWindow()
    if (!result) return { app: 'Unknown', url: '' }
    const url = 'url' in result && typeof (result as { url?: string }).url === 'string' ? (result as { url: string }).url : ''
    return { app: result.owner?.name ?? 'Unknown', url }
  } catch (err) {
    log.warn('[activeWindowService] active-win failed', err)
    return { app: 'Unknown', url: '' }
  }
}
