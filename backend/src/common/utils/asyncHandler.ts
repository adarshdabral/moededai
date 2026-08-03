import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async controller so any rejected promise is forwarded to Express's
 * error pipeline via next(err), instead of becoming an unhandled rejection.
 * Controllers never need their own try/catch - see CLAUDE.md §8.
 */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
