import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate, authenticateOptional, authorize } from '@common/middlewares/auth.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { upload } from '@common/middlewares/upload.middleware';
import { ROLES } from '@common/constants/roles';
import { courseController } from './course.controller';
import { topicController } from './topic.controller';
import { resourceController } from './resource.controller';
import { assignmentController } from './assignment.controller';
import { learningPathController } from './learningPath.controller';
import { enrollmentController } from './enrollment.controller';
import {
  courseListQuerySchema,
  createAssignmentSchema,
  createCourseSchema,
  createEnrollmentSchema,
  createLearningPathSchema,
  createLinkResourceSchema,
  createTopicSchema,
  updateAssignmentSchema,
  updateCourseSchema,
  updateEnrollmentStatusSchema,
  updateTopicSchema,
} from './course.validation';

const teacherOrAdmin = authorize(ROLES.TEACHER, ROLES.ADMIN);

export const courseRouter = Router();

/**
 * @openapi
 * /courses:
 *   post:
 *     summary: Create a course
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Course created }
 *       403: { description: Not a teacher/admin }
 *   get:
 *     summary: List courses (visibility varies by role - public sees published only)
 *     tags: [Courses]
 *     responses:
 *       200: { description: Paginated course list }
 */
courseRouter.post(
  '/',
  authenticate,
  teacherOrAdmin,
  validate(createCourseSchema),
  asyncHandler((req, res) => courseController.create(req, res))
);
courseRouter.get(
  '/',
  authenticateOptional,
  validate(courseListQuerySchema, 'query'),
  asyncHandler((req, res) => courseController.list(req, res))
);

/**
 * @openapi
 * /courses/{courseId}:
 *   get:
 *     summary: Get a course by ID
 *     tags: [Courses]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Course }
 *       404: { description: Not found }
 *   patch:
 *     summary: Update a course (owning teacher or admin only)
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated course }
 *       403: { description: Not the owning teacher/admin }
 */
courseRouter.get(
  '/:courseId',
  asyncHandler((req, res) => courseController.getById(req, res))
);
courseRouter.patch(
  '/:courseId',
  authenticate,
  teacherOrAdmin,
  validate(updateCourseSchema),
  asyncHandler((req, res) => courseController.update(req, res))
);

/**
 * @openapi
 * /courses/{courseId}/topics:
 *   post:
 *     summary: Add a topic to a course
 *     tags: [Topics]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Topic created } }
 *   get:
 *     summary: List a course's topics, in order
 *     tags: [Topics]
 *     responses: { 200: { description: Topic list } }
 */
courseRouter.post(
  '/:courseId/topics',
  authenticate,
  teacherOrAdmin,
  validate(createTopicSchema),
  asyncHandler((req, res) => topicController.create(req, res))
);
courseRouter.get(
  '/:courseId/topics',
  asyncHandler((req, res) => topicController.listByCourse(req, res))
);

/**
 * @openapi
 * /courses/{courseId}/assignments:
 *   post:
 *     summary: Create an assignment, optionally with a file attachment
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               dueAt: { type: string, format: date-time }
 *               file: { type: string, format: binary }
 *     responses: { 201: { description: Assignment created } }
 *   get:
 *     summary: List a course's assignments
 *     tags: [Assignments]
 *     responses: { 200: { description: Assignment list } }
 */
courseRouter.post(
  '/:courseId/assignments',
  authenticate,
  teacherOrAdmin,
  upload.single('file'),
  validate(createAssignmentSchema),
  asyncHandler((req, res) => assignmentController.create(req, res))
);
courseRouter.get(
  '/:courseId/assignments',
  authenticate,
  asyncHandler((req, res) => assignmentController.listByCourse(req, res))
);

/**
 * @openapi
 * /courses/{courseId}/learning-paths:
 *   post:
 *     summary: Create a learning path (ordered topic sequence) for a course
 *     tags: [LearningPaths]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Learning path created } }
 *   get:
 *     summary: List a course's learning paths
 *     tags: [LearningPaths]
 *     responses: { 200: { description: Learning path list } }
 */
courseRouter.post(
  '/:courseId/learning-paths',
  authenticate,
  teacherOrAdmin,
  validate(createLearningPathSchema),
  asyncHandler((req, res) => learningPathController.create(req, res))
);
courseRouter.get(
  '/:courseId/learning-paths',
  authenticate,
  asyncHandler((req, res) => learningPathController.listByCourse(req, res))
);

/**
 * @openapi
 * /courses/{courseId}/enrollments:
 *   post:
 *     summary: Enroll a student in a course (teacher/admin only)
 *     tags: [Enrollments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Enrollment created }
 *       409: { description: Student already enrolled }
 *   get:
 *     summary: List a course's roster (teacher/admin only)
 *     tags: [Enrollments]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Roster } }
 */
courseRouter.post(
  '/:courseId/enrollments',
  authenticate,
  teacherOrAdmin,
  validate(createEnrollmentSchema),
  asyncHandler((req, res) => enrollmentController.enroll(req, res))
);
courseRouter.get(
  '/:courseId/enrollments',
  authenticate,
  teacherOrAdmin,
  asyncHandler((req, res) => enrollmentController.listRoster(req, res))
);

/**
 * @openapi
 * /topics/{topicId}:
 *   patch:
 *     summary: Update a topic
 *     tags: [Topics]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Updated topic } }
 *   delete:
 *     summary: Delete a topic
 *     tags: [Topics]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Deleted } }
 */
export const topicRouter = Router();
topicRouter.patch(
  '/:topicId',
  authenticate,
  teacherOrAdmin,
  validate(updateTopicSchema),
  asyncHandler((req, res) => topicController.update(req, res))
);
topicRouter.delete(
  '/:topicId',
  authenticate,
  teacherOrAdmin,
  asyncHandler((req, res) => topicController.delete(req, res))
);

/**
 * @openapi
 * /topics/{topicId}/resources:
 *   post:
 *     summary: Attach a link resource (document/video/link) to a topic
 *     tags: [Resources]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Resource created } }
 *   get:
 *     summary: List a topic's resources
 *     tags: [Resources]
 *     responses: { 200: { description: Resource list } }
 * /topics/{topicId}/resources/upload:
 *   post:
 *     summary: Upload a file resource to a topic
 *     tags: [Resources]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               file: { type: string, format: binary }
 *     responses: { 201: { description: Resource created } }
 */
topicRouter.post(
  '/:topicId/resources',
  authenticate,
  teacherOrAdmin,
  validate(createLinkResourceSchema),
  asyncHandler((req, res) => resourceController.createLink(req, res))
);
topicRouter.post(
  '/:topicId/resources/upload',
  authenticate,
  teacherOrAdmin,
  upload.single('file'),
  asyncHandler((req, res) => resourceController.createUpload(req, res))
);
topicRouter.get(
  '/:topicId/resources',
  authenticate,
  asyncHandler((req, res) => resourceController.listByTopic(req, res))
);

/**
 * @openapi
 * /resources/{resourceId}:
 *   delete:
 *     summary: Delete a resource
 *     tags: [Resources]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Deleted } }
 */
export const resourceRouter = Router();
resourceRouter.delete(
  '/:resourceId',
  authenticate,
  teacherOrAdmin,
  asyncHandler((req, res) => resourceController.delete(req, res))
);

/**
 * @openapi
 * /assignments/{assignmentId}:
 *   patch:
 *     summary: Update an assignment
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Updated assignment } }
 *   delete:
 *     summary: Delete an assignment
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Deleted } }
 */
export const assignmentRouter = Router();
assignmentRouter.patch(
  '/:assignmentId',
  authenticate,
  teacherOrAdmin,
  validate(updateAssignmentSchema),
  asyncHandler((req, res) => assignmentController.update(req, res))
);
assignmentRouter.delete(
  '/:assignmentId',
  authenticate,
  teacherOrAdmin,
  asyncHandler((req, res) => assignmentController.delete(req, res))
);

/**
 * @openapi
 * /enrollments/me:
 *   get:
 *     summary: List the authenticated student's own enrollments
 *     tags: [Enrollments]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Own enrollments } }
 * /enrollments/{enrollmentId}:
 *   patch:
 *     summary: Update enrollment status (student may only drop their own; teacher/admin may set any status)
 *     tags: [Enrollments]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Updated enrollment } }
 */
export const enrollmentRouter = Router();
enrollmentRouter.get(
  '/me',
  authenticate,
  asyncHandler((req, res) => enrollmentController.listMine(req, res))
);
enrollmentRouter.patch(
  '/:enrollmentId',
  authenticate,
  validate(updateEnrollmentStatusSchema),
  asyncHandler((req, res) => enrollmentController.updateStatus(req, res))
);
