import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

const idParamSchema = z.object({ id: z.string().uuid() })

// Use with router.param('id', validateIdParam): a malformed id gets the standard 422
// (field "id") instead of reaching Postgres, which rejects it as an invalid uuid (500).
export function validateIdParam(_req: Request, _res: Response, next: NextFunction, id: string) {
  idParamSchema.parse({ id })
  next()
}
