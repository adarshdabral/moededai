import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate } from '@common/middlewares/auth.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { upload } from '@common/middlewares/upload.middleware';
import { userController } from './user.controller';
import { updateProfileSchema } from './user.validation';

export const userRouter = Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Not authenticated
 */
userRouter.get('/me', authenticate, asyncHandler((req, res) => userController.getMe(req, res)));

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Update the authenticated user's profile
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               avatarUrl: { type: string }
 *     responses:
 *       200:
 *         description: Updated user profile
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Not authenticated
 */
userRouter.patch(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler((req, res) => userController.updateMe(req, res))
);

/**
 * @openapi
 * /users/me/avatar:
 *   post:
 *     summary: Upload a profile image for the authenticated user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Updated user profile with new avatarUrl
 *       422:
 *         description: Missing or unsupported file
 */
userRouter.post(
  '/me/avatar',
  authenticate,
  upload.single('file'),
  asyncHandler((req, res) => userController.uploadAvatar(req, res))
);
