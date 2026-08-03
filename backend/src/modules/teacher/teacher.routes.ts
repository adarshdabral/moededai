import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate, authorize } from '@common/middlewares/auth.middleware';
import { ROLES } from '@common/constants/roles';
import { teacherPortalController } from './teacher.controller';

export const teacherPortalRouter = Router();

teacherPortalRouter.use(authenticate, authorize(ROLES.TEACHER));

/**
 * @openapi
 * /teacher/classes:
 *   get:
 *     summary: List the authenticated teacher's own courses
 *     tags: [TeacherPortal]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Owned courses } }
 */
teacherPortalRouter.get(
  '/classes',
  asyncHandler((req, res) => teacherPortalController.getMyClasses(req, res))
);

/**
 * @openapi
 * /teacher/students/{studentId}/analytics:
 *   get:
 *     summary: Growth analytics for a student enrolled in one of the teacher's courses
 *     tags: [TeacherPortal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Student growth analytics }
 *       403: { description: Student is not enrolled in any of your courses }
 */
teacherPortalRouter.get(
  '/students/:studentId/analytics',
  asyncHandler((req, res) => teacherPortalController.getStudentAnalytics(req, res))
);
