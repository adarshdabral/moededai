import { createHash } from 'crypto';

/**
 * SHA-256 hash for opaque, non-password secrets (refresh tokens, verification
 * tokens) that must be looked up by exact match but never stored raw.
 * Passwords use bcrypt (common/utils/password.ts) instead - never this.
 */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
