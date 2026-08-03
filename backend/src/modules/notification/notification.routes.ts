import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate, authorize } from '@common/middlewares/auth.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { ROLES } from '@common/constants/roles';
import { notificationController } from './notification.controller';
import { listNotificationsQuerySchema, sendAnnouncementSchema } from './notification.validation';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: List the authenticated user's notifications, unread first
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Paginated notification list } }
 */
notificationRouter.get(
  '/',
  validate(listNotificationsQuerySchema, 'query'),
  asyncHandler((req, res) => notificationController.listMine(req, res))
);

/**
 * @openapi
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Updated notification } }
 */
notificationRouter.patch(
  '/:notificationId/read',
  asyncHandler((req, res) => notificationController.markRead(req, res))
);

/**
 * @openapi
 * /notifications/announce:
 *   post:
 *     summary: Broadcast an announcement notification (admin-only), optionally scoped to one role
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: "{ recipientCount: number }" } }
 */
notificationRouter.post(
  '/announce',
  authorize(ROLES.ADMIN),
  validate(sendAnnouncementSchema),
  asyncHandler((req, res) => notificationController.sendAnnouncement(req, res))
);
