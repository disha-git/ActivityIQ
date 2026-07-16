import { desktopCapturer, screen } from 'electron'
import { log } from '../logger'

export interface CapturedScreenshot {
  buffer: Buffer
  mimeType: string
}

/**
 * Capture the primary display as raw JPEG bytes. Returns a Buffer, not a data
 * URL — the bytes are uploaded as multipart/form-data and stored in MySQL, so
 * base64 would only inflate them by ~33% on the wire.
 */
export async function captureScreenshot(quality = 60): Promise<CapturedScreenshot | null> {
  try {
    const primaryDisplay = screen.getPrimaryDisplay()
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(primaryDisplay.size.width * 0.5),
        height: Math.round(primaryDisplay.size.height * 0.5),
      },
    })
    const source = sources[0]
    if (!source || source.thumbnail.isEmpty()) return null
    return { buffer: source.thumbnail.toJPEG(quality), mimeType: 'image/jpeg' }
  } catch (err) {
    log.warn('[screenshotService] capture failed', err)
    return null
  }
}
