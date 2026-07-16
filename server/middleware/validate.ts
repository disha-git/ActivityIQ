import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

/** Validates req.body against a zod schema; replaces req.body with the parsed
 * (and type-coerced) result on success, or responds 400 with field errors. */
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed.',
        details: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      })
      return
    }
    req.body = result.data
    next()
  }
}
