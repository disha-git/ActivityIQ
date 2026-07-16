import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export interface AgentConfig {
  apiBaseUrl: string
  socketUrl: string
  dashboardUrl: string
  token: string | null
  employeeId: string | null
  employeeName: string | null
  activeEntryId: string | null
  activeProjectId: string | null
  autoLaunch: boolean
}

const DEFAULT_CONFIG: AgentConfig = {
  apiBaseUrl: 'http://localhost:4000',
  socketUrl: 'http://localhost:4000',
  dashboardUrl: 'http://localhost:5173',
  token: null,
  employeeId: null,
  employeeName: null,
  activeEntryId: null,
  activeProjectId: null,
  autoLaunch: false,
}

let cached: AgentConfig | null = null

function configPath(): string {
  return path.join(app.getPath('userData'), 'agent-config.json')
}

export function getConfig(): AgentConfig {
  if (cached) return cached
  let loaded: AgentConfig
  try {
    const raw = fs.readFileSync(configPath(), 'utf8')
    loaded = { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    loaded = { ...DEFAULT_CONFIG }
  }
  cached = loaded
  return loaded
}

export function updateConfig(patch: Partial<AgentConfig>): AgentConfig {
  const next = { ...getConfig(), ...patch }
  cached = next
  fs.mkdirSync(path.dirname(configPath()), { recursive: true })
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf8')
  return next
}

export function clearPairing(): void {
  updateConfig({
    token: null,
    employeeId: null,
    employeeName: null,
    activeEntryId: null,
    activeProjectId: null,
  })
}
