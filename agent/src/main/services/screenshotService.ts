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
 *
 * `scale` — fraction of the native (physical-pixel) resolution to capture.
 * 1.0 = full native resolution, 0.75 = 75%, etc.
 *
 * `quality` — JPEG quality (1–100). 85 is a good balance between file size
 * and clarity; 95+ for near-lossless text readability.
 */
export async function captureScreenshot(
  quality = 85,
  scale = 1.0,
): Promise<CapturedScreenshot | null> {
  try {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { scaleFactor } = primaryDisplay

    // Use physical pixels so HiDPI / Retina screens are captured at their
    // actual resolution instead of the logical (CSS) size.
    const nativeWidth = primaryDisplay.size.width * scaleFactor
    const nativeHeight = primaryDisplay.size.height * scaleFactor

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(nativeWidth * scale),
        height: Math.round(nativeHeight * scale),
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