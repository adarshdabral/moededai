import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate, authorize } from '@common/middlewares/auth.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { ROLES } from '@common/constants/roles';
import { monthlyAssessmentController } from './monthlyAssessment.controller';
import { scheduleMonthlyAssessmentSchema } from './monthlyAssessment.validation';

const teacherOrAdmin = authorize(ROLES.TEACHER, ROLES.ADMIN);

/** Nested under /courses/:courseId/monthly-assessments - mounted in course.routes-style from app.ts. */
export const courseMonthlyAssessmentRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /courses/{courseId}/monthly-assessments:
 *   post:
 *     summary: Schedule a monthly assessment for a course (generates one personalized AI test per active student)
 *     tags: [MonthlyAssessments]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Assessment scheduled } }
 *   get:
 *     summary: List a course's monthly assessments (teacher/admin only)
 *     tags: [MonthlyAssessments]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Assessment list } }
 */
courseMonthlyAssessmentRouter.post(
  '/',
  authenticate,
  teacherOrAdmin,
  validate(scheduleMonthlyAssessmentSchema),
  asyncHandler((req, res) => monthlyAssessmentController.schedule(req, res))
);
courseMonthlyAssessmentRouter.get(
  '/',
  authenticate,
  teacherOrAdmin,
  asyncHandler((req, res) => monthlyAssessmentController.listByCourse(req, res))
);

export const monthlyAssessmentRouter = Router();

/**
 * @openapi
 * /monthly-assessments/{assessmentId}:
 *   get:
 *     summary: Get a monthly assessment's status
 *     tags: [MonthlyAssessments]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Assessment } }
 */
monthlyAssessmentRouter.get(
  '/:assessmentId',
  authenticate,
  asyncHandler((req, res) => monthlyAssessmentController.getById(req, res))
);

/**
 * @openapi
 * /monthly-assessments/{assessmentId}/attempts:
 *   post:
 *     summary: Start the authenticated student's attempt at their personalized assessment test
 *     tags: [MonthlyAssessments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: "Attempt started - submit via PATCH /test-attempts/:id/submit" }
 *       400: { description: Assessment is not currently open }
 *       404: { description: No personalized test found for this student }
 */
monthlyAssessmentRouter.post(
  '/:assessmentId/attempts',
  authenticate,
  authorize(ROLES.STUDENT),
  asyncHandler((req, res) => monthlyAssessmentController.startMyAttempt(req, res))
);
