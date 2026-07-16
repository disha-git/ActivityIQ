import multer from 'multer'
import type { NextFunction, Request, Response } from 'express'

/** Screenshots go straight into MySQL, so keep the bytes in memory — never on disk. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

export const uploadScreenshot = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error(`Unsupported image type "${file.mimetype}". Expected JPEG, PNG or WebP.`))
      return
    }
    cb(null, true)
  },
}).single('image')

/**
 * multer reports "file too large" and rejected types by handing an error to
 * next(), which would otherwise surface as a 500. Translate them to 400/413.
 */
export function handleUploadErrors(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    res.status(status).json({ error: err.message })
    return
  }
  if (err instanceof Error) {
    res.status(400).json({ error: err.message })
    return
  }
  next(err)
}
