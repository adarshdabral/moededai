/**
 * Phase 10 (Hardening): a single end-to-end pass exercising every module
 * together in one realistic user journey, as opposed to the per-module
 * integration tests elsewhere under tests/integration/. If a cross-module
 * wiring mistake slips past the unit-level tests, this is what catches it.
 */
import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';
import { createUserFixture } from '../setup/fixtures';
import { aiClient } from '../../src/ai';
import { monthlyAssessmentService } from '../../src/modules/assessment/monthlyAssessment.service';
import { AuditLogModel } from '../../src/modules/admin/auditLog.model';

const app = createApp();

const QUIZ = {
  questions: [
    { type: 'mcq', prompt: 'Q1', options: ['A', 'B'], correctAnswer: 'A', points: 50 },
    { type: 'mcq', prompt: 'Q2', options: ['A', 'B'], correctAnswer: 'B', points: 50 },
  ],
};

describe('E2E: full platform journey across every module', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
    jest.restoreAllMocks();
  });

  it('carries one student, one teacher, and one admin through the entire platform', async () => {
    jest.spyOn(aiClient, 'generateChatReply').mockResolvedValue('Here is an explanation.');
    jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(QUIZ);

    // --- Admin & Teacher provisioning (Phase 2 + Phase 8) ---
    const admin = await createUserFixture('admin', 'e2eadmin');
    const teacherCreateRes = await request(app)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'E2E Teacher', email: 'e2eteacher@example.com', password: 'Password123', role: 'teacher' });
    expect(teacherCreateRes.status).toBe(201);
    const teacherLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'e2eteacher@example.com', password: 'Password123' });
    const teacherToken = teacherLoginRes.body.data.tokens.accessToken as string;
    const teacherId = teacherLoginRes.body.data.user.id as string;

    // --- Student self-registration (Phase 2) ---
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'E2E Student',
      email: 'e2estudent@example.com',
      password: 'Password123',
      gradeLevel: 'Grade 10',
    });
    expect(registerRes.status).toBe(201);
    const studentToken = registerRes.body.data.tokens.accessToken as string;
    const studentId = registerRes.body.data.user.id as string;

    // --- Course authoring (Phase 3) ---
    const courseRes = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'E2E Course', subject: 'Science', gradeLevel: 'Grade 10', teacherIds: [teacherId] });
    const courseId = courseRes.body.data.id as string;

    const topicRes = await request(app)
      .post(`/api/v1/courses/${courseId}/topics`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Photosynthesis', order: 1 });
    const topicId = topicRes.body.data.id as string;

    await request(app)
      .patch(`/api/v1/courses/${courseId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ isPublished: true });

    await request(app)
      .post(`/api/v1/courses/${courseId}/enrollments`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ studentId });

    // --- AI Tutor (Phase 4) ---
    const conversationRes = await request(app)
      .post('/api/v1/ai-tutor/conversations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ topicId });
    const conversationId = conversationRes.body.data.id as string;
    const chatRes = await request(app)
      .post(`/api/v1/ai-tutor/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'What is photosynthesis?' });
    expect(chatRes.status).toBe(200);

    // --- AI Test Generation & Knowledge Score (Phase 5) ---
    const testGenRes = await request(app)
      .post('/api/v1/ai-test/generate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ topicId, difficulty: 'medium', questionCount: 2, timeLimitMinutes: 15 });
    const testId = testGenRes.body.data.id as string;

    const attemptRes = await request(app)
      .post('/api/v1/test-attempts')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ testId });
    const submitRes = await request(app)
      .patch(`/api/v1/test-attempts/${attemptRes.body.data.id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: [
          { questionIndex: 0, response: 'A' },
          { questionIndex: 1, response: 'B' },
        ],
      });
    expect(submitRes.body.data.score).toBe(100);

    const scoresRes = await request(app)
      .get('/api/v1/knowledge-scores/me')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(scoresRes.body.data[0].currentScore).toBe(100);

    // --- Monthly Assessments (Phase 6) ---
    await request(app)
      .post(`/api/v1/courses/${courseId}/monthly-assessments`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        topicId,
        scheduledFor: new Date(Date.now() - 1000).toISOString(),
        windowClosesAt: new Date(Date.now() + 86400000).toISOString(),
      });
    await monthlyAssessmentService.runScheduler(new Date());

    // --- Growth & Comparative Analytics (Phase 6) ---
    const growthRes = await request(app)
      .get('/api/v1/analytics/me/growth')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(growthRes.body.data.topicMastery.length).toBeGreaterThan(0);

    const comparativeRes = await request(app)
      .get(`/api/v1/analytics/courses/${courseId}/comparative`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(comparativeRes.body.data).toHaveLength(1);

    // --- Anonymous Doubts & Identity Protection (Phase 7) ---
    const doubtRes = await request(app)
      .post('/api/v1/doubts')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId, topicId, question: 'Why do plants need sunlight?' });
    const doubtId = doubtRes.body.data.id as string;

    await request(app)
      .post(`/api/v1/doubts/${doubtId}/replies`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ message: 'Sunlight drives the light reaction of photosynthesis.' });

    const reportRes = await request(app)
      .post(`/api/v1/doubts/${doubtId}/report`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ reason: 'Testing the abuse-report flow end to end.' });

    await request(app)
      .patch(`/api/v1/admin/reports/${reportRes.body.data.id}/resolve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'dismissed', resolutionNotes: 'Not a violation - E2E test.' });

    const resolveIdentityRes = await request(app)
      .post('/api/v1/admin/identity/resolve')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        anonymousId: doubtRes.body.data.authorAnonymousId,
        reason: 'E2E test verifying the audited resolution path end to end.',
      });
    expect(resolveIdentityRes.body.data.userId).toBe(studentId);
    const identityAudits = await AuditLogModel.find({ action: 'IDENTITY_RESOLVED' }).exec();
    expect(identityAudits).toHaveLength(1);

    // --- Teacher & Admin Portals (Phase 8) ---
    const classesRes = await request(app)
      .get('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(classesRes.body.data).toHaveLength(1);

    // --- Notifications (Phase 9) ---
    const notifRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);
    const notificationTypes = notifRes.body.data.map((n: { type: string }) => n.type).sort();
    expect(notificationTypes).toEqual(['score_update', 'test_reminder']);

    // --- Admin account lifecycle management (Phase 8), closing the loop ---
    const deactivateRes = await request(app)
      .patch(`/api/v1/admin/users/${teacherId}/deactivate`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'E2E test verifying deactivation end to end.' });
    expect(deactivateRes.body.data.isActive).toBe(false);

    const blockedLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'e2eteacher@example.com', password: 'Password123' });
    expect(blockedLoginRes.status).toBe(401);
  });
});
