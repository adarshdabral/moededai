import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';
import { createUserFixture, createTopicFixture } from '../setup/fixtures';
import { aiClient } from '../../src/ai';

const app = createApp();

const TWO_MCQ_QUIZ = {
  questions: [
    { type: 'mcq', prompt: 'Q1', options: ['A', 'B'], correctAnswer: 'A', points: 50 },
    { type: 'mcq', prompt: 'Q2', options: ['A', 'B'], correctAnswer: 'B', points: 50 },
  ],
};

async function completeAPerfectAttempt(studentToken: string, topicId: string) {
  const testRes = await request(app)
    .post('/api/v1/ai-test/generate')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ topicId, difficulty: 'medium', questionCount: 2, timeLimitMinutes: 15 });

  const startRes = await request(app)
    .post('/api/v1/test-attempts')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ testId: testRes.body.data.id });

  await request(app)
    .patch(`/api/v1/test-attempts/${startRes.body.data.id}/submit`)
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      answers: [
        { questionIndex: 0, response: 'A' },
        { questionIndex: 1, response: 'B' },
      ],
    });
}

describe('Analytics', () => {
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

  it("returns the student's growth analytics after completing an attempt", async () => {
    jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
    const { topic } = await createTopicFixture();
    const { accessToken } = await createUserFixture('student');

    await completeAPerfectAttempt(accessToken, String(topic._id));

    const res = await request(app)
      .get('/api/v1/analytics/me/growth')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.topicMastery).toEqual([
      expect.objectContaining({ topicId: String(topic._id), currentScore: 100 }),
    ]);
    expect(res.body.data.progressTimeline).toHaveLength(1);
    expect(res.body.data.learningStreakDays).toBe(0);
  });

  it("rejects a teacher who doesn't own the course from viewing the comparative report", async () => {
    const { course } = await createTopicFixture();
    const stranger = await createUserFixture('teacher', 'stranger');

    const res = await request(app)
      .get(`/api/v1/analytics/courses/${course._id}/comparative`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('rejects students from viewing the comparative report', async () => {
    const { course } = await createTopicFixture();
    const { accessToken } = await createUserFixture('student');

    const res = await request(app)
      .get(`/api/v1/analytics/courses/${course._id}/comparative`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });

  it('shows the owning teacher a comparative report across enrolled students', async () => {
    jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
    const { teacher, course, topic } = await createTopicFixture();
    const student = await createUserFixture('student');
    await request(app)
      .post(`/api/v1/courses/${course._id}/enrollments`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({ studentId: String(student.user._id) });

    await completeAPerfectAttempt(student.accessToken, String(topic._id));

    const res = await request(app)
      .get(`/api/v1/analytics/courses/${course._id}/comparative`)
      .set('Authorization', `Bearer ${teacher.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      expect.objectContaining({
        studentId: String(student.user._id),
        averageScore: 100,
        topicsAssessed: 1,
      }),
    ]);
  });
});
