import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate, authorize } from '@common/middlewares/auth.middleware';
import { ROLES } from '@common/constants/roles';
import { analyticsController } from './analytics.controller';

export const analyticsRouter = Router();

/**
 * @openapi
 * /analytics/me/growth:
 *   get:
 *     summary: Growth analytics for the authenticated student (topic mastery, progress timeline, learning streak)
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Growth analytics } }
 */
analyticsRouter.get(
  '/me/growth',
  authenticate,
  authorize(ROLES.STUDENT),
  asyncHandler((req, res) => analyticsController.getMyGrowth(req, res))
);

/**
 * @openapi
 * /analytics/courses/{courseId}/comparative:
 *   get:
 *     summary: Comparative performance report across a course's active students (teacher/admin only)
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Per-student average score, descending } }
 */
analyticsRouter.get(
  '/courses/:courseId/comparative',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler((req, res) => analyticsController.getCourseComparative(req, res))
);
