import { powerMonitor } from 'electron'

export function getIdleSeconds(): number {
  return powerMonitor.getSystemIdleTime()
}

export function isIdle(thresholdSeconds = 120): boolean {
  return getIdleSeconds() >= thresholdSeconds
}
