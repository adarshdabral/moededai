import { randomUUID } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@config/env';
import { Role } from '@common/constants/roles';
import { UnauthorizedError } from '@common/errors/AppError';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  } as SignOptions);
}

export function signRefreshToken(payload: { sub: string }): string {
  // `jti` guarantees two tokens issued for the same user in the same second
  // (identical `sub`+`iat`+`exp`) are never byte-identical - without it,
  // rapid login/refresh calls can produce duplicate JWTs, which collide on
  // the unique tokenHash index in the refresh_tokens collection.
  const fullPayload: RefreshTokenPayload = { sub: payload.sub, jti: randomUUID() };
  return jwt.sign(fullPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError('Session expired or invalid. Please log in again.');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token.');
  }
}
