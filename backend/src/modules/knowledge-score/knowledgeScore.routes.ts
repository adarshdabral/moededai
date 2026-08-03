import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate, authorize } from '@common/middlewares/auth.middleware';
import { ROLES } from '@common/constants/roles';
import { knowledgeScoreController } from './knowledgeScore.controller';

export const knowledgeScoreRouter = Router();

knowledgeScoreRouter.use(authenticate, authorize(ROLES.STUDENT));

/**
 * @openapi
 * /knowledge-scores/me:
 *   get:
 *     summary: Get the authenticated student's current Knowledge Score per topic
 *     tags: [KnowledgeScore]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: List of per-topic scores } }
 */
knowledgeScoreRouter.get(
  '/me',
  asyncHandler((req, res) => knowledgeScoreController.listMine(req, res))
);

/**
 * @openapi
 * /knowledge-scores/me/weak-topics:
 *   get:
 *     summary: Get the authenticated student's weak topics (score below threshold), weakest first
 *     tags: [KnowledgeScore]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Weak topics, ascending by score } }
 */
knowledgeScoreRouter.get(
  '/me/weak-topics',
  asyncHandler((req, res) => knowledgeScoreController.listWeakTopics(req, res))
);
