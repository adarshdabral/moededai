import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@common/utils/jwt';
import { UnauthorizedError } from '@common/errors/AppError';

describe('jwt utilities', () => {
  it('signs and verifies an access token round-trip', () => {
    const token = signAccessToken({ sub: 'user-1', role: 'student' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('student');
  });

  it('signs and verifies a refresh token round-trip', () => {
    const token = signRefreshToken({ sub: 'user-1' });
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe('user-1');
  });

  it('throws UnauthorizedError for a malformed access token', () => {
    expect(() => verifyAccessToken('not-a-real-token')).toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError for a malformed refresh token', () => {
    expect(() => verifyRefreshToken('not-a-real-token')).toThrow(UnauthorizedError);
  });

  it('rejects a refresh token verified as an access token (different secrets)', () => {
    const refreshToken = signRefreshToken({ sub: 'user-1' });
    expect(() => verifyAccessToken(refreshToken)).toThrow(UnauthorizedError);
  });
});
