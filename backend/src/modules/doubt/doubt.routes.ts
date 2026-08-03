import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate, authorize } from '@common/middlewares/auth.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { ROLES } from '@common/constants/roles';
import { doubtController } from './doubt.controller';
import { doubtReplyController } from './doubtReply.controller';
import { abuseReportController } from './abuseReport.controller';
import {
  createDoubtSchema,
  createReplySchema,
  doubtListQuerySchema,
  fileAbuseReportSchema,
  resolveAbuseReportSchema,
  updateDoubtStatusSchema,
} from './doubt.validation';

const teacherOrAdmin = authorize(ROLES.TEACHER, ROLES.ADMIN);

/** Nested under /courses/:courseId/doubts. */
export const courseDoubtRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /courses/{courseId}/doubts:
 *   get:
 *     summary: Teacher/admin inbox of anonymous doubts for a course, optionally filtered by status
 *     tags: [Doubts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Doubt list - authorAnonymousId only, never a real identity" }
 */
courseDoubtRouter.get(
  '/',
  authenticate,
  teacherOrAdmin,
  validate(doubtListQuerySchema, 'query'),
  asyncHandler((req, res) => doubtController.listByCourse(req, res))
);

export const doubtRouter = Router();

/**
 * @openapi
 * /doubts:
 *   post:
 *     summary: Post an anonymous doubt (student)
 *     tags: [Doubts]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Doubt posted } }
 */
doubtRouter.post(
  '/',
  authenticate,
  authorize(ROLES.STUDENT),
  validate(createDoubtSchema),
  asyncHandler((req, res) => doubtController.post(req, res))
);

/**
 * @openapi
 * /doubts/me:
 *   get:
 *     summary: List the authenticated student's own posted doubts
 *     tags: [Doubts]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Own doubts } }
 */
doubtRouter.get(
  '/me',
  authenticate,
  authorize(ROLES.STUDENT),
  asyncHandler((req, res) => doubtController.listMine(req, res))
);

/**
 * @openapi
 * /doubts/{doubtId}:
 *   get:
 *     summary: Get a doubt (accessible to its anonymous author or the course's teacher/admin)
 *     tags: [Doubts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Doubt }
 *       403: { description: Not the author, and not the course's teacher/admin }
 */
doubtRouter.get(
  '/:doubtId',
  authenticate,
  asyncHandler((req, res) => doubtController.getById(req, res))
);

/**
 * @openapi
 * /doubts/{doubtId}/status:
 *   patch:
 *     summary: Update a doubt's status (teacher/admin of the course only)
 *     tags: [Doubts]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Updated doubt } }
 */
doubtRouter.patch(
  '/:doubtId/status',
  authenticate,
  teacherOrAdmin,
  validate(updateDoubtStatusSchema),
  asyncHandler((req, res) => doubtController.updateStatus(req, res))
);

/**
 * @openapi
 * /doubts/{doubtId}/replies:
 *   post:
 *     summary: Reply to a doubt (the anonymous author, or the course's teacher/admin)
 *     tags: [Doubts]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Reply posted } }
 *   get:
 *     summary: Get a doubt's reply thread
 *     tags: [Doubts]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Reply thread, oldest first } }
 */
doubtRouter.post(
  '/:doubtId/replies',
  authenticate,
  validate(createReplySchema),
  asyncHandler((req, res) => doubtReplyController.create(req, res))
);
doubtRouter.get(
  '/:doubtId/replies',
  authenticate,
  asyncHandler((req, res) => doubtReplyController.listByDoubt(req, res))
);

/**
 * @openapi
 * /doubts/{doubtId}/report:
 *   post:
 *     summary: Report a doubt for abuse (reporter identity is recorded, never anonymous)
 *     tags: [AbuseReports]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Report filed } }
 */
doubtRouter.post(
  '/:doubtId/report',
  authenticate,
  validate(fileAbuseReportSchema),
  asyncHandler((req, res) => {
    req.body = { reportedDoubtId: req.params.doubtId, reason: req.body.reason };
    return abuseReportController.create(req, res);
  })
);

export const replyRouter = Router();

/**
 * @openapi
 * /replies/{replyId}/report:
 *   post:
 *     summary: Report a reply for abuse (reporter identity is recorded, never anonymous)
 *     tags: [AbuseReports]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Report filed } }
 */
replyRouter.post(
  '/:replyId/report',
  authenticate,
  validate(fileAbuseReportSchema),
  asyncHandler((req, res) => {
    req.body = { reportedReplyId: req.params.replyId, reason: req.body.reason };
    return abuseReportController.create(req, res);
  })
);

export const abuseReportRouter = Router();

abuseReportRouter.use(authenticate, authorize(ROLES.ADMIN));

/**
 * @openapi
 * /admin/reports:
 *   get:
 *     summary: List abuse reports, pending first (admin only)
 *     tags: [AbuseReports]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Paginated report list } }
 */
abuseReportRouter.get(
  '/',
  asyncHandler((req, res) => abuseReportController.list(req, res))
);

/**
 * @openapi
 * /admin/reports/{reportId}/resolve:
 *   patch:
 *     summary: Resolve or dismiss an abuse report (admin only)
 *     tags: [AbuseReports]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Updated report } }
 */
abuseReportRouter.patch(
  '/:reportId/resolve',
  validate(resolveAbuseReportSchema),
  asyncHandler((req, res) => abuseReportController.resolve(req, res))
);
