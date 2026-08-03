import { ErrorCode } from './errorCodes';

export interface ErrorDetail {
  field?: string;
  issue: string;
}

/**
 * Base class for every error thrown deliberately by application code (services,
 * repositories, the AI client). Anything else that reaches the error middleware
 * is treated as an unexpected 500 - see common/middlewares/error.middleware.ts.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: ErrorDetail[]
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ErrorDetail[]) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found.`, 404, ErrorCode.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required to access this resource.') {
    super(message, 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'The request conflicts with existing state.') {
    super(message, 409, ErrorCode.CONFLICT);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'The request could not be processed.', details?: ErrorDetail[]) {
    super(message, 422, ErrorCode.UNPROCESSABLE_ENTITY, details);
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, ErrorCode.RATE_LIMITED);
  }
}

/**
 * Thrown by src/ai/gemini.client.ts to translate any Gemini SDK failure
 * (timeout, quota, malformed response) into a typed, safe-to-catch error.
 * Callers outside src/ai/ must never see a raw SDK exception.
 */
export class AIProviderError extends AppError {
  constructor(message = 'The AI provider is temporarily unavailable.') {
    super(message, 502, ErrorCode.AI_PROVIDER_ERROR);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'The service is temporarily unavailable.') {
    super(message, 503, ErrorCode.SERVICE_UNAVAILABLE);
  }
}
