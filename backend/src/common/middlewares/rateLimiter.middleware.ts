import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env, isTest } from '@config/env';
import { ErrorCode } from '@common/errors/errorCodes';
import { MESSAGES } from '@common/constants/messages';
import { sendError } from '@common/utils/apiResponse';

function rateLimitHandler(_req: Request, res: Response): void {
  sendError(res, 429, ErrorCode.RATE_LIMITED, MESSAGES.RATE_LIMITED);
}

// Rate limiting is a perimeter/infra concern orthogonal to business-logic
// tests, and its actual behavior is exercised deliberately under load testing
// (docs/ROADMAP.md Phase 10), not incidentally by fast-firing functional
// tests sharing one in-memory store. Disabled only when NODE_ENV=test.
const skipInTest = () => isTest;

/** Applied globally in app.ts. */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitHandler,
});

/** Applied only to auth endpoints (login, register, password reset) to resist brute force. */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: Math.max(10, Math.floor(env.RATE_LIMIT_MAX_REQUESTS / 5)),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitHandler,
});
