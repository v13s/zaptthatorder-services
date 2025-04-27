import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number | string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(Number(err.statusCode)).json({
      error: {
        message: err.message,
        statusCode: Number(err.statusCode)
      }
    });
  }

  console.error(err);
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      statusCode: 500
    }
  });
}; 