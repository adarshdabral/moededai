import { Router } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';
import { authenticate, authorize } from '@common/middlewares/auth.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { ROLES } from '@common/constants/roles';
import { adminController } from './admin.controller';
import { adminUserController } from './adminUser.controller';
import { adminSettingsController } from './adminSettings.controller';
import { listAuditLogsQuerySchema, resolveIdentitySchema } from './admin.validation';
import {
  createPrivilegedUserSchema,
  deactivationReasonSchema,
  listUsersQuerySchema,
  updatePlatformSettingsSchema,
} from './adminUser.validation';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize(ROLES.ADMIN));

/**
 * @openapi
 * /admin/identity/resolve:
 *   post:
 *     summary: "[Admin-only, audited] Resolve an anonymous ID to a real identity"
 *     description: >
 *       Every call writes an audit_logs entry (actor, target, reason) before returning.
 *       This is the only endpoint in the system capable of unmasking an anonymous doubt author.
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [anonymousId, reason]
 *             properties:
 *               anonymousId: { type: string }
 *               reason: { type: string, description: "Required justification, min 10 characters" }
 *     responses:
 *       200: { description: Resolved identity }
 *       403: { description: Not an admin }
 *       404: { description: No such anonymous ID }
 */
adminRouter.post(
  '/identity/resolve',
  validate(resolveIdentitySchema),
  asyncHandler((req, res) => adminController.resolveIdentity(req, res))
);

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     summary: List audit log entries, most recent first (admin-only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Paginated audit log list } }
 */
adminRouter.get(
  '/audit-logs',
  validate(listAuditLogsQuerySchema, 'query'),
  asyncHandler((req, res) => adminController.listAuditLogs(req, res))
);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: List users, optionally filtered by role/isActive (admin-only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Paginated user list } }
 *   post:
 *     summary: Create a teacher or admin account (the only way besides npm run seed)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               role: { type: string, enum: [teacher, admin] }
 *     responses:
 *       201: { description: Account created }
 *       409: { description: Email already in use }
 */
adminRouter.get(
  '/users',
  validate(listUsersQuerySchema, 'query'),
  asyncHandler((req, res) => adminUserController.list(req, res))
);
adminRouter.post(
  '/users',
  validate(createPrivilegedUserSchema),
  asyncHandler((req, res) => adminUserController.create(req, res))
);

/**
 * @openapi
 * /admin/users/{userId}/deactivate:
 *   patch:
 *     summary: Deactivate a user account (revokes all sessions, writes an audit log)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Updated user } }
 * /admin/users/{userId}/reactivate:
 *   patch:
 *     summary: Reactivate a previously-deactivated user account (writes an audit log)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Updated user } }
 */
adminRouter.patch(
  '/users/:userId/deactivate',
  validate(deactivationReasonSchema),
  asyncHandler((req, res) => adminUserController.deactivate(req, res))
);
adminRouter.patch(
  '/users/:userId/reactivate',
  validate(deactivationReasonSchema),
  asyncHandler((req, res) => adminUserController.reactivate(req, res))
);

/**
 * @openapi
 * /admin/settings:
 *   get:
 *     summary: Get platform-wide settings (admin-only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Platform settings } }
 *   patch:
 *     summary: Update platform-wide settings (admin-only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Updated platform settings } }
 */
adminRouter.get(
  '/settings',
  asyncHandler((req, res) => adminSettingsController.get(req, res))
);
adminRouter.patch(
  '/settings',
  validate(updatePlatformSettingsSchema),
  asyncHandler((req, res) => adminSettingsController.update(req, res))
);
