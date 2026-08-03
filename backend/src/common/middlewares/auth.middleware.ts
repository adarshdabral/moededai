import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '@common/utils/jwt';
import { ForbiddenError, UnauthorizedError } from '@common/errors/AppError';
import { Role } from '@common/constants/roles';

const BEARER_PREFIX = 'Bearer ';

/**
 * Verifies the JWT access token and attaches { id, role } to req.user.
 * Stateless - does not touch the database. See docs/ARCHITECTURE.md §8a.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedError('Authentication is required to access this resource.');
  }

  const token = header.slice(BEARER_PREFIX.length);
  const payload = verifyAccessToken(token);

  req.user = { id: payload.sub, role: payload.role };
  next();
}

/**
 * Attaches req.user when a valid bearer token is present, but never rejects
 * the request otherwise. Used by `public` routes whose response shape still
 * varies by viewer (e.g. course visibility) - see CLAUDE.md §6 (every route
 * declares an explicit auth policy: public / authenticated / role:<role>).
 */
export function authenticateOptional(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith(BEARER_PREFIX)) {
    const token = header.slice(BEARER_PREFIX.length);
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  }
  next();
}

/**
 * Role-based access control. Every route with a role restriction uses this -
 * never re-implemented ad hoc inside a controller. See CLAUDE.md §10.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
}
