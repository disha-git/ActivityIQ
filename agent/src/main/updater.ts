import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { app } from 'electron'
import { log } from './logger'

autoUpdater.logger = log

// electron-builder.yml has no `publish` block configured, so this is a documented
// no-op until a release feed is set up — code-complete, not functionally verified.
export function checkForUpdates(): void {
  if (!app.isPackaged) return
  autoUpdater.checkForUpdatesAndNotify().catch((err) => log.warn('[updater] check failed', err))
}
