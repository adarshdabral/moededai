export const MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again later.',
  NOT_FOUND: (resource: string) => `${resource} not found.`,
  UNAUTHORIZED: 'Authentication is required to access this resource.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  VALIDATION_FAILED: 'Validation failed for the request.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TOKEN_EXPIRED: 'Session expired. Please log in again.',
  TOKEN_INVALID: 'Invalid or malformed token.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  EMAIL_ALREADY_IN_USE: 'An account with this email already exists.',
  ACCOUNT_DEACTIVATED: 'This account has been deactivated.',
} as const;
