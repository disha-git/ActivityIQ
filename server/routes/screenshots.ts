import { Router } from 'express'
import { get, run } from '../db.ts'
import { requireAuth } from '../auth.ts'
import { requireAgentAuth, type AgentAuthedRequest } from '../middleware/requireAgentAuth.ts'
import { uploadScreenshot, handleUploadErrors } from '../middleware/upload.ts'
import { createScreenshot, getScreenshotImage } from '../services/screenshotService.ts'
import { OCR_ENABLED, extractText } from '../services/ai/ocrService.ts'
import { emitToAll } from '../sockets.ts'

const router = Router()

/**
 * POST /api/screenshots — multipart/form-data upload from the desktop agent.
 * The image arrives as a Buffer (multer memoryStorage) and goes straight into
 * the LONGBLOB column; nothing is written to disk.
 */
router.post(
  '/',
  requireAgentAuth,
  uploadScreenshot,
  handleUploadErrors,
  async (req: AgentAuthedRequest, res) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'An image file is required (multipart field "image").' })
      return
    }

    const employeeId = req.employee!.id
    const body = req.body as Record<string, string | undefined>

    // entryId is optional, but when supplied it must belong to this employee —
    // otherwise an agent could attach screenshots to someone else's session.
    let entryId: string | null = null
    if (body.entryId) {
      const entry = await get('SELECT id FROM time_entries WHERE id = ? AND employee_id = ?', [
        body.entryId,
        employeeId,
      ])
      if (!entry) {
        res.status(404).json({ error: 'Unknown time entry for this employee.' })
        return
      }
      entryId = body.entryId
    }

    const score = Number(body.productivityScore)
    const capturedAt = body.capturedAt && !Number.isNaN(Date.parse(body.capturedAt))
      ? new Date(body.capturedAt).toISOString()
      : new Date().toISOString()

    const id = await createScreenshot({
      employeeId,
      entryId,
      image: file.buffer,
      mimeType: file.mimetype,
      activeWindow: body.activeWindow?.slice(0, 512) ?? null,
      capturedAt,
      productivityScore: Number.isFinite(score) && score >= 0 && score <= 100 ? Math.round(score) : null,
      aiSummary: body.aiSummary ?? null,
    })

    emitToAll('screenshot:new', { employeeId, entryId, id, capturedAt })
    res.status(201).json({ id, imageUrl: `/api/screenshots/${id}`, bytes: file.size })

    if (OCR_ENABLED) {
      extractText(file.buffer)
        .then((text) => run('UPDATE screenshots SET ocr_text = ? WHERE id = ?', [text, id]))
        .catch((err) => console.error(`OCR failed for screenshot ${id}:`, err))
    }
  },
)

/**
 * GET /api/screenshots/:id — stream the stored bytes back with a real
 * Content-Type so an <img src> renders it directly in the dashboard.
 */
router.get('/:id', requireAuth, async (req, res) => {
  const row = await getScreenshotImage(req.params.id)
  if (!row) {
    res.status(404).json({ error: 'Screenshot not found.' })
    return
  }

  res.setHeader('Content-Type', row.image_mime)
  res.setHeader('Content-Length', String(row.image.length))
  // Bytes for a given id never change, so let the browser keep them.
  res.setHeader('Cache-Control', 'private, max-age=86400, immutable')
  res.send(row.image)
})

export default router
