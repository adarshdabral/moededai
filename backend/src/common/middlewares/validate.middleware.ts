import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { ValidationError } from '@common/errors/AppError';

export type ValidationTarget = 'body' | 'query' | 'params';

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    issue: issue.message,
  }));
}

/**
 * Validates and replaces req[target] with the Zod-parsed (and coerced/defaulted)
 * value, so controllers can trust the shape without re-checking it. See CLAUDE.md §7/§10.
 */
export function validate(schema: ZodTypeAny, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      throw new ValidationError('Validation failed for the request.', formatZodError(result.error));
    }
    req[target] = result.data;
    next();
  };
}
