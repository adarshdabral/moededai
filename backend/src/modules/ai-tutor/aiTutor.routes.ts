import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate, authorize } from '@common/middlewares/auth.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { ROLES } from '@common/constants/roles';
import { aiTutorController } from './aiTutor.controller';
import {
  listConversationsQuerySchema,
  sendMessageSchema,
  startConversationSchema,
} from './aiTutor.validation';

export const aiTutorRouter = Router();

aiTutorRouter.use(authenticate, authorize(ROLES.STUDENT));

/**
 * @openapi
 * /ai-tutor/conversations:
 *   post:
 *     summary: Start a new AI Tutor conversation, optionally scoped to a topic
 *     tags: [AiTutor]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Conversation created } }
 *   get:
 *     summary: List the authenticated student's recent conversations
 *     tags: [AiTutor]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Paginated conversation list } }
 */
aiTutorRouter.post(
  '/conversations',
  validate(startConversationSchema),
  asyncHandler((req, res) => aiTutorController.start(req, res))
);
aiTutorRouter.get(
  '/conversations',
  validate(listConversationsQuerySchema, 'query'),
  asyncHandler((req, res) => aiTutorController.listMine(req, res))
);

/**
 * @openapi
 * /ai-tutor/conversations/{conversationId}:
 *   get:
 *     summary: Get a conversation with full message history
 *     tags: [AiTutor]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Conversation detail }
 *       403: { description: Not your conversation }
 */
aiTutorRouter.get(
  '/conversations/:conversationId',
  asyncHandler((req, res) => aiTutorController.getById(req, res))
);

/**
 * @openapi
 * /ai-tutor/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message and receive the AI Tutor's reply
 *     tags: [AiTutor]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated conversation including the new exchange }
 *       502: { description: AI provider unavailable }
 */
aiTutorRouter.post(
  '/conversations/:conversationId/messages',
  validate(sendMessageSchema),
  asyncHandler((req, res) => aiTutorController.sendMessage(req, res))
);
