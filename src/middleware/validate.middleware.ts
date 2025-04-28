import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator/check';
import { AppError } from './error.middleware';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(
      errors.array().map((err: any) => err.msg).join(', '),
      400
    );
  }
  next();
}; 