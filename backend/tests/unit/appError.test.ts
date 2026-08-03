import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@common/errors/AppError';
import { ErrorCode } from '@common/errors/errorCodes';

describe('AppError hierarchy', () => {
  it('sets statusCode, code, and message on the base class', () => {
    const error = new AppError('Something broke', 418, ErrorCode.INTERNAL_ERROR);
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.message).toBe('Something broke');
    expect(error.isOperational).toBe(true);
  });

  it('NotFoundError defaults to 404 with a resource-shaped message', () => {
    const error = new NotFoundError('Course');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('Course not found.');
  });

  it('ValidationError carries field-level details', () => {
    const error = new ValidationError('Validation failed', [
      { field: 'email', issue: 'Invalid email format' },
    ]);
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual([{ field: 'email', issue: 'Invalid email format' }]);
  });

  it('UnauthorizedError defaults to 401', () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
  });

  it('ForbiddenError defaults to 403', () => {
    expect(new ForbiddenError().statusCode).toBe(403);
  });

  it('ConflictError defaults to 409', () => {
    expect(new ConflictError().statusCode).toBe(409);
  });
});
