import { Menu, Tray, nativeImage, app, shell } from 'electron'
import { getConfig } from './config'

// 1x1 transparent PNG placeholder — swap for a real brand icon before packaging a release.
const PLACEHOLDER_ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

let tray: Tray | null = null

export interface TrayCallbacks {
  onToggleTracking: () => void
  onShowWindow: () => void
  isTracking: () => boolean
}

let activeCallbacks: TrayCallbacks | null = null

export function createTray(callbacks: TrayCallbacks): Tray {
  activeCallbacks = callbacks
  const icon = nativeImage.createFromDataURL(PLACEHOLDER_ICON_DATA_URL).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.on('click', () => callbacks.onShowWindow())
  refreshTrayMenu()
  return tray
}

export function refreshTrayMenu(): void {
  if (!tray || !activeCallbacks) return
  const config = getConfig()
  const tracking = activeCallbacks.isTracking()

  const menu = Menu.buildFromTemplate([
    { label: config.employeeName ? `Signed in as ${config.employeeName}` : 'Not paired', enabled: false },
    { type: 'separator' },
    {
      label: tracking ? 'Stop tracking' : 'Start tracking',
      click: () => activeCallbacks?.onToggleTracking(),
      enabled: Boolean(config.token),
    },
    { label: 'Open agent window', click: () => activeCallbacks?.onShowWindow() },
    { label: 'Open web dashboard', click: () => shell.openExternal(config.dashboardUrl) },
    { type: 'separator' },
    { label: 'Quit ActivityIQ Agent', click: () => app.quit() },
  ])

  tray.setContextMenu(menu)
  tray.setToolTip(tracking ? 'ActivityIQ Agent — tracking' : 'ActivityIQ Agent')
}
