import { NextFunction, Request, Response } from 'express';
import { AppError } from '@common/errors/AppError';
import { ErrorCode } from '@common/errors/errorCodes';
import { MESSAGES } from '@common/constants/messages';
import { sendError } from '@common/utils/apiResponse';
import { logger } from '@config/logger';

/**
 * The single place an error becomes an HTTP response. Every thrown error in the
 * app (from asyncHandler-wrapped controllers, or middleware calling next(err))
 * ends up here. See CLAUDE.md §8.
 */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    logger.warn(err.message, {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      path: req.originalUrl,
      stack: err.stack,
    });
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  const error = err as Error;
  logger.error('Unhandled error', {
    requestId,
    path: req.originalUrl,
    message: error?.message,
    stack: error?.stack,
  });

  sendError(res, 500, ErrorCode.INTERNAL_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
}

export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(res, 404, ErrorCode.NOT_FOUND, `Route ${req.method} ${req.originalUrl} not found.`);
}
