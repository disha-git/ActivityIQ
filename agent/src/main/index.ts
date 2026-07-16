import { app, BrowserWindow, powerMonitor } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { log } from './logger'
import { getConfig } from './config'
import { registerIpcHandlers, getTrackingState, stateEvents, stopTrackingFlow } from './ipc'
import { createTray, refreshTrayMenu } from './tray'
import { checkForUpdates } from './updater'
import { getActiveWindowInfo } from './services/activeWindowService'
import { getIdleSeconds } from './services/idleService'
import { captureScreenshot } from './services/screenshotService'
import { enqueue, flushQueue } from './services/syncQueue'
import { connectSocket, emitActivitySample } from './services/socketClient'
import { apiClient } from './services/apiClient'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ACTIVITY_SAMPLE_INTERVAL_MS = 60_000
const SCREENSHOT_INTERVAL_MS = 10_000
const QUEUE_FLUSH_INTERVAL_MS = 30_000
const HEARTBEAT_INTERVAL_MS = 60_000
const IDLE_THRESHOLD_SECONDS = 300

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 380,
    height: 520,
    resizable: false,
    title: 'ActivityIQ Agent',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  })

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win.hide()
    }
  })

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl) {
    win.loadURL(rendererUrl)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

function showWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createWindow()
    return
  }
  mainWindow.show()
  mainWindow.focus()
}

async function toggleTrackingFromTray(): Promise<void> {
  try {
    if (getTrackingState().tracking) {
      await stopTrackingFlow()
    } else {
      showWindow()
    }
    refreshTrayMenu()
  } catch (err) {
    log.warn('[main] tray toggle failed', err)
  }
}

async function sampleActivityLoop(): Promise<void> {
  const state = getTrackingState()
  if (!state.tracking || !state.entryId || !state.projectId) return

  const idleSeconds = getIdleSeconds()
  const windowInfo = await getActiveWindowInfo()
  const activityScore = Math.max(0, 100 - Math.min(100, Math.round((idleSeconds / IDLE_THRESHOLD_SECONDS) * 100)))
  const durationMinutes = Math.round(ACTIVITY_SAMPLE_INTERVAL_MS / 60_000) || 1

  const payload = {
    entryId: state.entryId,
    projectId: state.projectId,
    app: windowInfo.app,
    url: windowInfo.url,
    activity: activityScore,
    durationMinutes,
    idleSeconds,
  }

  try {
    await apiClient.postActivity(payload)
  } catch (err) {
    log.warn('[main] activity sample failed, queuing', err)
    enqueue({ kind: 'activity', payload })
  }
  emitActivitySample({ entryId: state.entryId, app: windowInfo.app, activity: activityScore })
}

async function captureScreenshotLoop(): Promise<void> {
  const state = getTrackingState()
  if (!state.tracking || !state.entryId) return

  const shot = await captureScreenshot()
  if (!shot) return

  const capturedAt = new Date().toISOString()

  try {
    await apiClient.postScreenshot({
      entryId: state.entryId,
      buffer: shot.buffer,
      mimeType: shot.mimeType,
      capturedAt,
    })
  } catch (err) {
    log.warn('[main] screenshot upload failed, queuing', err)
    // The queue is JSON on disk, so the Buffer is parked as base64 and rebuilt
    // at flush time. The upload itself is always multipart bytes.
    enqueue({
      kind: 'screenshot',
      payload: {
        entryId: state.entryId,
        imageBase64: shot.buffer.toString('base64'),
        mimeType: shot.mimeType,
        capturedAt,
      },
    })
  }
}

function heartbeatLoop(): void {
  const config = getConfig()
  if (!config.token) return
  apiClient.heartbeat().catch((err) => log.warn('[main] heartbeat failed', err))
}

function startBackgroundLoops(): void {
  setInterval(() => void sampleActivityLoop(), ACTIVITY_SAMPLE_INTERVAL_MS)
  setInterval(() => void captureScreenshotLoop(), SCREENSHOT_INTERVAL_MS)
  setInterval(() => void flushQueue(), QUEUE_FLUSH_INTERVAL_MS)
  setInterval(heartbeatLoop, HEARTBEAT_INTERVAL_MS)
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => showWindow())

  app.whenReady().then(() => {
    log.info('[main] ActivityIQ Agent starting')

    registerIpcHandlers()
    stateEvents.on('state-changed', (state) => {
      refreshTrayMenu()
      for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send('agent:state', state)
      }
    })

    mainWindow = createWindow()

    createTray({
      onToggleTracking: () => void toggleTrackingFromTray(),
      onShowWindow: showWindow,
      isTracking: () => getTrackingState().tracking,
    })

    try {
      app.setLoginItemSettings({ openAtLogin: getConfig().autoLaunch })
    } catch (err) {
      log.warn('[main] setLoginItemSettings failed (expected on unsigned/dev builds)', err)
    }

    if (getConfig().token) {
      connectSocket()
    }

    // TEMP-DIAG: screenshot capability probe
    void (async () => {
      const { systemPreferences } = await import('electron')
      let screenStatus = 'n/a'
      try { screenStatus = systemPreferences.getMediaAccessStatus('screen') } catch (e) { screenStatus = `err:${e}` }
      log.info(`[DIAG] screen permission status = ${screenStatus}`)
      const shot = await captureScreenshot()
      log.info(`[DIAG] captureScreenshot -> ${shot ? `${shot.mimeType} ${shot.buffer.length} bytes` : 'NULL'}`)
    })()

    startBackgroundLoops()
    checkForUpdates()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
      else showWindow()
    })
  })

  app.on('before-quit', () => {
    isQuitting = true
  })

  app.on('window-all-closed', () => {
    // Keep the process alive in the tray on all platforms — quitting only
    // happens via the tray menu or the OS explicitly terminating the app.
  })

  // Reduce false idle penalties immediately after the OS wakes from sleep.
  powerMonitor.on('resume', () => {
    log.info('[main] system resumed from sleep')
  })
}
