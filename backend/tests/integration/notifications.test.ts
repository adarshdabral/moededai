import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';
import { createUserFixture, createTopicFixture } from '../setup/fixtures';
import { aiClient } from '../../src/ai';
import { monthlyAssessmentService } from '../../src/modules/assessment/monthlyAssessment.service';

const app = createApp();

const TWO_MCQ_QUIZ = {
  questions: [
    { type: 'mcq', prompt: 'Q1', options: ['A', 'B'], correctAnswer: 'A', points: 50 },
    { type: 'mcq', prompt: 'Q2', options: ['A', 'B'], correctAnswer: 'B', points: 50 },
  ],
};

describe('Notifications', () => {
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

  it('creates a score_update notification after a test attempt is submitted', async () => {
    jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
    const { topic } = await createTopicFixture();
    const { accessToken } = await createUserFixture('student');

    const testRes = await request(app)
      .post('/api/v1/ai-test/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ topicId: String(topic._id), difficulty: 'medium', questionCount: 2, timeLimitMinutes: 15 });
    const startRes = await request(app)
      .post('/api/v1/test-attempts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ testId: testRes.body.data.id });
    await request(app)
      .patch(`/api/v1/test-attempts/${startRes.body.data.id}/submit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        answers: [
          { questionIndex: 0, response: 'A' },
          { questionIndex: 1, response: 'B' },
        ],
      });

    const notifRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.data).toHaveLength(1);
    expect(notifRes.body.data[0]).toMatchObject({ type: 'score_update', isRead: false });
  });

  it('lets a user mark their own notification as read, and rejects marking another user\'s', async () => {
    jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
    const { topic } = await createTopicFixture();
    const owner = await createUserFixture('student', 'owner');
    const stranger = await createUserFixture('student', 'stranger');

    const testRes = await request(app)
      .post('/api/v1/ai-test/generate')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ topicId: String(topic._id), difficulty: 'medium', questionCount: 2, timeLimitMinutes: 15 });
    const startRes = await request(app)
      .post('/api/v1/test-attempts')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ testId: testRes.body.data.id });
    await request(app)
      .patch(`/api/v1/test-attempts/${startRes.body.data.id}/submit`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        answers: [
          { questionIndex: 0, response: 'A' },
          { questionIndex: 1, response: 'B' },
        ],
      });

    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    const notificationId = listRes.body.data[0].id;

    const strangerAttempt = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);
    expect(strangerAttempt.status).toBe(403);

    const ownAttempt = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(ownAttempt.status).toBe(200);
    expect(ownAttempt.body.data.isRead).toBe(true);
  });

  it('lets an admin broadcast an announcement to all students', async () => {
    const admin = await createUserFixture('admin');
    const studentA = await createUserFixture('student', 'alpha');
    const studentB = await createUserFixture('student', 'beta');
    await createUserFixture('teacher'); // should NOT receive a student-scoped announcement

    const announceRes = await request(app)
      .post('/api/v1/notifications/announce')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Platform maintenance', body: 'We will be down at midnight.', role: 'student' });

    expect(announceRes.status).toBe(201);
    expect(announceRes.body.data.recipientCount).toBe(2);

    const aRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentA.accessToken}`);
    expect(aRes.body.data).toHaveLength(1);
    expect(aRes.body.data[0].type).toBe('announcement');

    const bRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentB.accessToken}`);
    expect(bRes.body.data).toHaveLength(1);
  });

  it('rejects non-admins from sending an announcement', async () => {
    const teacher = await createUserFixture('teacher');
    const res = await request(app)
      .post('/api/v1/notifications/announce')
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({ title: 'X', body: 'Y' });
    expect(res.status).toBe(403);
  });

  it('sends a test_reminder notification to each student when a monthly assessment opens', async () => {
    jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
    const { teacher, course, topic } = await createTopicFixture();
    const student = await createUserFixture('student');
    await request(app)
      .post(`/api/v1/courses/${course._id}/enrollments`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({ studentId: String(student.user._id) });

    await request(app)
      .post(`/api/v1/courses/${course._id}/monthly-assessments`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({
        topicId: String(topic._id),
        scheduledFor: new Date(Date.now() - 1000).toISOString(),
        windowClosesAt: new Date(Date.now() + 86400000).toISOString(),
      });

    await monthlyAssessmentService.runScheduler(new Date());

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${student.accessToken}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe('test_reminder');
  });
});
