import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';
import { createUserFixture, createTopicFixture } from '../setup/fixtures';

const app = createApp();

describe('Teacher Portal', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  it("lists only the authenticated teacher's own courses", async () => {
    const { teacher, course } = await createTopicFixture();
    const otherTeacher = await createUserFixture('teacher', 'other');

    const res = await request(app)
      .get('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${teacher.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(String(course._id));

    const otherRes = await request(app)
      .get('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${otherTeacher.accessToken}`);
    expect(otherRes.body.data).toHaveLength(0);
  });

  it('rejects viewing analytics for a student not enrolled in any of the teacher\'s courses', async () => {
    const { teacher } = await createTopicFixture();
    const student = await createUserFixture('student');

    const res = await request(app)
      .get(`/api/v1/teacher/students/${student.user._id}/analytics`)
      .set('Authorization', `Bearer ${teacher.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('returns analytics for a student enrolled in the teacher\'s course', async () => {
    const { teacher, course } = await createTopicFixture();
    const student = await createUserFixture('student');
    await request(app)
      .post(`/api/v1/courses/${course._id}/enrollments`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({ studentId: String(student.user._id) });

    const res = await request(app)
      .get(`/api/v1/teacher/students/${student.user._id}/analytics`)
      .set('Authorization', `Bearer ${teacher.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('topicMastery');
    expect(res.body.data).toHaveProperty('progressTimeline');
    expect(res.body.data).toHaveProperty('learningStreakDays');
  });

  it('rejects students from accessing teacher portal endpoints', async () => {
    const { accessToken } = await createUserFixture('student');
    const res = await request(app)
      .get('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });
});
