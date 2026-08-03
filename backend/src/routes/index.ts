import { Router } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { isDatabaseConnected } from '@config/database';
import { ServiceUnavailableError } from '@common/errors/AppError';

export const rootRouter = Router();

/**
 * @openapi
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: >
 *       Returns 200 whenever the Node process is up and able to handle a request, regardless of
 *       MongoDB connectivity. An orchestrator (k8s, ECS, etc.) uses this to decide whether to
 *       restart the container - restarting won't fix a database outage, so this must not depend
 *       on the database.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Process is alive
 */
rootRouter.get('/health/live', (_req, res) => {
  sendSuccess(res, { status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Readiness probe
 *     description: >
 *       Returns 200 only when the API process AND its MongoDB connection are healthy. An
 *       orchestrator uses this to decide whether to route traffic to this instance.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Database is not connected
 */
rootRouter.get('/health', (_req, res) => {
  const dbConnected = isDatabaseConnected();
  if (!dbConnected) {
    throw new ServiceUnavailableError('Database connection is not ready.');
  }
  sendSuccess(res, {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});
