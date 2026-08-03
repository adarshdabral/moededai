import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { validate } from '@common/middlewares/validate.middleware';
import { authRateLimiter } from '@common/middlewares/rateLimiter.middleware';
import { authController } from './auth.controller';
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.validation';

export const authRouter = Router();

authRouter.use(authRateLimiter);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new student account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, gradeLevel]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               gradeLevel: { type: string }
 *     responses:
 *       201:
 *         description: Account created; returns user profile and token pair
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Email already in use
 */
authRouter.post(
  '/register',
  validate(registerSchema),
  asyncHandler((req, res) => authController.register(req, res))
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Returns user profile and token pair
 *       401:
 *         description: Invalid credentials or deactivated account
 */
authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler((req, res) => authController.login(req, res))
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Exchange a valid refresh token for a new token pair
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New token pair issued
 *       401:
 *         description: Invalid or expired refresh token
 */
authRouter.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler((req, res) => authController.refresh(req, res))
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Revoke a refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       204:
 *         description: Logged out
 */
authRouter.post(
  '/logout',
  validate(logoutSchema),
  asyncHandler((req, res) => authController.logout(req, res))
);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Redeem an email verification token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired token
 */
authRouter.post(
  '/verify-email',
  validate(verifyEmailSchema),
  asyncHandler((req, res) => authController.verifyEmail(req, res))
);

/**
 * @openapi
 * /auth/request-password-reset:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Always returns success to avoid leaking account existence
 */
authRouter.post(
  '/request-password-reset',
  validate(requestPasswordResetSchema),
  asyncHandler((req, res) => authController.requestPasswordReset(req, res))
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a valid reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password reset; all sessions revoked
 *       400:
 *         description: Invalid or expired token
 */
authRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler((req, res) => authController.resetPassword(req, res))
);
