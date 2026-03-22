import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const connectSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});

export const validateConnect = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = connectSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: result.error.errors,
    });
  }

  next();
};
