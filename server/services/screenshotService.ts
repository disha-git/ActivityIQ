import { all, get, run, newId } from '../db.ts'

export interface ScreenshotMeta {
  id: string
  capturedAt: string
  activeWindow: string | null
  productivityScore: number | null
  aiSummary: string | null
}

export interface StoredImage {
  image: Buffer
  image_mime: string
  captured_at: string
}

export interface CreateScreenshotInput {
  employeeId: string
  entryId: string | null
  image: Buffer
  mimeType: string
  activeWindow: string | null
  capturedAt: string
  productivityScore: number | null
  aiSummary: string | null
}

/** Insert a screenshot, storing the raw bytes in the LONGBLOB column. */
export async function createScreenshot(input: CreateScreenshotInput): Promise<string> {
  const id = newId('s')
  await run(
    `INSERT INTO screenshots
       (id, entry_id, employee_id, captured_at, image, image_mime, active_window, ai_summary, productivity_score, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.entryId,
      input.employeeId,
      input.capturedAt,
      input.image,
      input.mimeType,
      input.activeWindow,
      input.aiSummary,
      input.productivityScore,
      new Date().toISOString(),
    ],
  )
  return id
}

/**
 * Fetch the bytes for one screenshot. Deliberately a separate query from the
 * metadata listing so that paging through history never drags LONGBLOBs across
 * the wire.
 */
export function getScreenshotImage(id: string): Promise<StoredImage | undefined> {
  return get<StoredImage>('SELECT image, image_mime, captured_at FROM screenshots WHERE id = ?', [id])
}

export interface HistoryPage {
  screenshots: ScreenshotMeta[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Paginated screenshot history for one employee, optionally filtered to a single day. */
export async function listScreenshotsForEmployee(
  employeeId: string,
  page: number,
  limit: number,
  date: string | null,
): Promise<HistoryPage> {
  const where: string[] = ['employee_id = ?']
  const params: unknown[] = [employeeId]

  if (date) {
    // captured_at is an ISO-8601 string, so a day is a simple prefix range.
    where.push('captured_at >= ? AND captured_at < ?')
    params.push(`${date}T00:00:00.000Z`, `${date}T23:59:59.999Z`)
  }

  const whereSql = where.join(' AND ')

  const countRow = await get<{ total: number }>(
    `SELECT COUNT(*) AS total FROM screenshots WHERE ${whereSql}`,
    params,
  )
  const total = Number(countRow?.total ?? 0)

  const offset = (page - 1) * limit
  const rows = await all<{
    id: string
    captured_at: string
    active_window: string | null
    productivity_score: number | null
    ai_summary: string | null
  }>(
    `SELECT id, captured_at, active_window, productivity_score, ai_summary
       FROM screenshots
      WHERE ${whereSql}
      ORDER BY captured_at DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  )

  return {
    screenshots: rows.map((r) => ({
      id: r.id,
      capturedAt: r.captured_at,
      activeWindow: r.active_window,
      productivityScore: r.productivity_score,
      aiSummary: r.ai_summary,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}
