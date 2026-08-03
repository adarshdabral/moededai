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

async function enrollStudent(teacherToken: string, courseId: string, studentId: string) {
  return request(app)
    .post(`/api/v1/courses/${courseId}/enrollments`)
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ studentId });
}

describe('Monthly Assessments', () => {
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

  it('rejects scheduling when there are no active enrolled students', async () => {
    const { teacher, course, topic } = await createTopicFixture();

    const res = await request(app)
      .post(`/api/v1/courses/${course._id}/monthly-assessments`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({
        topicId: String(topic._id),
        scheduledFor: new Date(Date.now() - 1000).toISOString(),
        windowClosesAt: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(400);
  });

  it('schedules an assessment, generating one personalized test per active student', async () => {
    jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
    const { teacher, course, topic } = await createTopicFixture();
    const student = await createUserFixture('student');
    await enrollStudent(teacher.accessToken, String(course._id), String(student.user._id));

    const res = await request(app)
      .post(`/api/v1/courses/${course._id}/monthly-assessments`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({
        topicId: String(topic._id),
        scheduledFor: new Date(Date.now() - 1000).toISOString(),
        windowClosesAt: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.studentCount).toBe(1);
    expect(res.body.data.status).toBe('scheduled');
  });

  it('rejects a student starting an attempt before the window opens', async () => {
    jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
    const { teacher, course, topic } = await createTopicFixture();
    const student = await createUserFixture('student');
    await enrollStudent(teacher.accessToken, String(course._id), String(student.user._id));

    const scheduleRes = await request(app)
      .post(`/api/v1/courses/${course._id}/monthly-assessments`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({
        topicId: String(topic._id),
        scheduledFor: new Date(Date.now() + 86400000).toISOString(),
        windowClosesAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      });

    const res = await request(app)
      .post(`/api/v1/monthly-assessments/${scheduleRes.body.data.id}/attempts`)
      .set('Authorization', `Bearer ${student.accessToken}`);

    expect(res.status).toBe(400);
  });

  it('lets an enrolled student attempt and submit once the window is open (via the scheduler)', async () => {
    jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
    const { teacher, course, topic } = await createTopicFixture();
    const student = await createUserFixture('student');
    await enrollStudent(teacher.accessToken, String(course._id), String(student.user._id));

    const scheduleRes = await request(app)
      .post(`/api/v1/courses/${course._id}/monthly-assessments`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({
        topicId: String(topic._id),
        scheduledFor: new Date(Date.now() - 1000).toISOString(),
        windowClosesAt: new Date(Date.now() + 86400000).toISOString(),
      });

    await monthlyAssessmentService.runScheduler(new Date());

    const attemptRes = await request(app)
      .post(`/api/v1/monthly-assessments/${scheduleRes.body.data.id}/attempts`)
      .set('Authorization', `Bearer ${student.accessToken}`);
    expect(attemptRes.status).toBe(201);
    expect(attemptRes.body.data.attemptType).toBe('monthly_assessment');

    const submitRes = await request(app)
      .patch(`/api/v1/test-attempts/${attemptRes.body.data.id}/submit`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({
        answers: [
          { questionIndex: 0, response: 'A' },
          { questionIndex: 1, response: 'B' },
        ],
      });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.score).toBe(100);
  });

  it('rejects a student who is not part of the assessment', async () => {
    jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
    const { teacher, course, topic } = await createTopicFixture();
    const enrolled = await createUserFixture('student', 'enrolled');
    const outsider = await createUserFixture('student', 'outsider');
    await enrollStudent(teacher.accessToken, String(course._id), String(enrolled.user._id));

    const scheduleRes = await request(app)
      .post(`/api/v1/courses/${course._id}/monthly-assessments`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({
        topicId: String(topic._id),
        scheduledFor: new Date(Date.now() - 1000).toISOString(),
        windowClosesAt: new Date(Date.now() + 86400000).toISOString(),
      });
    await monthlyAssessmentService.runScheduler(new Date());

    const res = await request(app)
      .post(`/api/v1/monthly-assessments/${scheduleRes.body.data.id}/attempts`)
      .set('Authorization', `Bearer ${outsider.accessToken}`);

    expect(res.status).toBe(404);
  });

  it("prevents a non-owning teacher from scheduling on another teacher's course", async () => {
    const { course, topic } = await createTopicFixture();
    const stranger = await createUserFixture('teacher', 'stranger');

    const res = await request(app)
      .post(`/api/v1/courses/${course._id}/monthly-assessments`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .send({
        topicId: String(topic._id),
        scheduledFor: new Date(Date.now() - 1000).toISOString(),
        windowClosesAt: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(403);
  });
});
