import path from 'path';
import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env, isProduction } from '@config/env';
import { swaggerSpec } from '@config/swagger';
import { globalRateLimiter } from '@common/middlewares/rateLimiter.middleware';
import { requestIdMiddleware, httpAccessLogger } from '@common/middlewares/requestLogger.middleware';
import { errorMiddleware, notFoundMiddleware } from '@common/middlewares/error.middleware';
import { rootRouter } from '@routes/index';
import { authRouter } from '@modules/auth/auth.routes';
import { userRouter } from '@modules/user/user.routes';
import {
  assignmentRouter,
  courseRouter,
  enrollmentRouter,
  resourceRouter,
  topicRouter,
} from '@modules/course/course.routes';
import { aiTutorRouter } from '@modules/ai-tutor/aiTutor.routes';
import { aiTestRouter, testAttemptRouter } from '@modules/ai-test/aiTest.routes';
import { knowledgeScoreRouter } from '@modules/knowledge-score/knowledgeScore.routes';
import {
  courseMonthlyAssessmentRouter,
  monthlyAssessmentRouter,
} from '@modules/assessment/monthlyAssessment.routes';
import { analyticsRouter } from '@modules/analytics/analytics.routes';
import {
  abuseReportRouter,
  courseDoubtRouter,
  doubtRouter,
  replyRouter,
} from '@modules/doubt/doubt.routes';
import { adminRouter } from '@modules/admin/admin.routes';
import { teacherPortalRouter } from '@modules/teacher/teacher.routes';
import { notificationRouter } from '@modules/notification/notification.routes';

export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(httpAccessLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(globalRateLimiter);

  if (!isProduction) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  // Serves files written by the local StorageClient (common/storage). A cloud
  // storage provider would make this line unnecessary - files would be
  // fetched directly from the provider's URL instead.
  app.use(`/${env.UPLOAD_DIR}`, express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  app.use(env.API_PREFIX, rootRouter);
  app.use(`${env.API_PREFIX}/auth`, authRouter);
  app.use(`${env.API_PREFIX}/users`, userRouter);
  app.use(`${env.API_PREFIX}/courses`, courseRouter);
  app.use(`${env.API_PREFIX}/topics`, topicRouter);
  app.use(`${env.API_PREFIX}/resources`, resourceRouter);
  app.use(`${env.API_PREFIX}/assignments`, assignmentRouter);
  app.use(`${env.API_PREFIX}/enrollments`, enrollmentRouter);
  app.use(`${env.API_PREFIX}/ai-tutor`, aiTutorRouter);
  app.use(`${env.API_PREFIX}/ai-test`, aiTestRouter);
  app.use(`${env.API_PREFIX}/test-attempts`, testAttemptRouter);
  app.use(`${env.API_PREFIX}/knowledge-scores`, knowledgeScoreRouter);
  app.use(`${env.API_PREFIX}/courses/:courseId/monthly-assessments`, courseMonthlyAssessmentRouter);
  app.use(`${env.API_PREFIX}/monthly-assessments`, monthlyAssessmentRouter);
  app.use(`${env.API_PREFIX}/analytics`, analyticsRouter);
  app.use(`${env.API_PREFIX}/courses/:courseId/doubts`, courseDoubtRouter);
  app.use(`${env.API_PREFIX}/doubts`, doubtRouter);
  app.use(`${env.API_PREFIX}/replies`, replyRouter);
  app.use(`${env.API_PREFIX}/admin/reports`, abuseReportRouter);
  app.use(`${env.API_PREFIX}/admin`, adminRouter);
  app.use(`${env.API_PREFIX}/teacher`, teacherPortalRouter);
  app.use(`${env.API_PREFIX}/notifications`, notificationRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
