import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate, authorize } from '@common/middlewares/auth.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { ROLES } from '@common/constants/roles';
import { aiTestController } from './aiTest.controller';
import { testAttemptController } from './testAttempt.controller';
import { generateTestSchema, startAttemptSchema, submitAttemptSchema } from './aiTest.validation';

export const aiTestRouter = Router();

/**
 * @openapi
 * /ai-test/generate:
 *   post:
 *     summary: Generate an AI quiz for a topic (student-initiated practice test)
 *     tags: [AiTest]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Generated test (correctAnswer never included) }
 *       400: { description: AI output failed validation }
 */
aiTestRouter.post(
  '/generate',
  authenticate,
  authorize(ROLES.STUDENT),
  validate(generateTestSchema),
  asyncHandler((req, res) => aiTestController.generate(req, res))
);

/**
 * @openapi
 * /ai-test/{testId}:
 *   get:
 *     summary: Get a generated test's questions (without answers)
 *     tags: [AiTest]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Test } }
 */
aiTestRouter.get(
  '/:testId',
  authenticate,
  asyncHandler((req, res) => aiTestController.getById(req, res))
);

export const testAttemptRouter = Router();

testAttemptRouter.use(authenticate, authorize(ROLES.STUDENT));

/**
 * @openapi
 * /test-attempts:
 *   post:
 *     summary: Start an attempt at a generated test
 *     tags: [TestAttempts]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Attempt started } }
 *   get:
 *     summary: List the authenticated student's own attempts
 *     tags: [TestAttempts]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Paginated attempt list } }
 */
testAttemptRouter.post(
  '/',
  validate(startAttemptSchema),
  asyncHandler((req, res) => testAttemptController.start(req, res))
);
testAttemptRouter.get(
  '/',
  asyncHandler((req, res) => testAttemptController.listMine(req, res))
);

/**
 * @openapi
 * /test-attempts/{attemptId}:
 *   get:
 *     summary: Get an attempt's current state
 *     tags: [TestAttempts]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Attempt } }
 */
testAttemptRouter.get(
  '/:attemptId',
  asyncHandler((req, res) => testAttemptController.getById(req, res))
);

/**
 * @openapi
 * /test-attempts/{attemptId}/submit:
 *   patch:
 *     summary: Submit answers for grading (server-side scoring only, never client-supplied)
 *     tags: [TestAttempts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Graded attempt, including updated Knowledge Score }
 *       400: { description: Already submitted, or answers incomplete/invalid }
 */
testAttemptRouter.patch(
  '/:attemptId/submit',
  validate(submitAttemptSchema),
  asyncHandler((req, res) => testAttemptController.submit(req, res))
);
