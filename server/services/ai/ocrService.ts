import { createWorker } from 'tesseract.js'

/** Off by default — OCR is CPU-heavy. Enable with OCR_ENABLED=true in the environment. */
export const OCR_ENABLED = process.env.OCR_ENABLED === 'true'

/** Extracts text from a screenshot. Accepts raw bytes (screenshots now live in
 * MySQL, not on disk) or a path. Real (not mocked) OCR via tesseract.js
 * (pure JS/WASM, no native compilation required). Only called when OCR_ENABLED. */
export async function extractText(image: string | Buffer): Promise<string> {
  const worker = await createWorker('eng')
  try {
    const {
      data: { text },
    } = await worker.recognize(image)
    return text.trim()
  } finally {
    await worker.terminate()
  }
}
