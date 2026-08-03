import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { morganStream } from '@config/logger';

/** Attaches a per-request correlation ID, used by every log line emitted while handling it. */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

morgan.token('request-id', (req: Request) => req.requestId ?? '-');

export const httpAccessLogger = morgan(
  ':request-id :method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream }
);
