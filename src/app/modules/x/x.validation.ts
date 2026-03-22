import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

const callbackSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  state: z.string().min(1, 'State is required')
})

export const validateCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = callbackSchema.safeParse(req.query)

  if (!result.success) {
    return res.redirect(
      `${process.env.FRONTEND_BASE_URL}/app/accounts?error=invalid_callback` // ✅
    )
  }

  next()
}