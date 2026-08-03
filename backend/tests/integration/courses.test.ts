import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';
import { createUserFixture } from '../setup/fixtures';

const app = createApp();

async function createPublishedCourse(teacherToken: string, teacherId: string) {
  const res = await request(app)
    .post('/api/v1/courses')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({
      title: 'Algebra I',
      subject: 'Mathematics',
      gradeLevel: 'Grade 9',
      teacherIds: [teacherId],
    });
  return res.body.data as { id: string };
}

describe('Course management', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  describe('POST /courses', () => {
    it('lets a teacher create a course owned by themselves', async () => {
      const { user, accessToken } = await createUserFixture('teacher');
      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Algebra I',
          subject: 'Mathematics',
          gradeLevel: 'Grade 9',
          teacherIds: ['ignored-should-be-overridden'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.teacherIds).toEqual([String(user._id)]);
      expect(res.body.data.isPublished).toBe(false);
    });

    it('rejects course creation by a student with 403', async () => {
      const { accessToken } = await createUserFixture('student');
      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Algebra I', subject: 'Mathematics', gradeLevel: 'Grade 9', teacherIds: ['x'] });

      expect(res.status).toBe(403);
    });

    it('lets an admin create a course assigned to a real teacher', async () => {
      const { accessToken: adminToken } = await createUserFixture('admin');
      const { user: teacher } = await createUserFixture('teacher');

      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Physics',
          subject: 'Science',
          gradeLevel: 'Grade 11',
          teacherIds: [String(teacher._id)],
        });

      expect(res.status).toBe(201);
    });

    it('rejects an admin assigning a non-teacher as teacherIds', async () => {
      const { accessToken: adminToken } = await createUserFixture('admin');
      const { user: student } = await createUserFixture('student');

      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Physics',
          subject: 'Science',
          gradeLevel: 'Grade 11',
          teacherIds: [String(student._id)],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /courses visibility', () => {
    it('hides unpublished courses from unauthenticated visitors', async () => {
      const { accessToken, user } = await createUserFixture('teacher');
      await createPublishedCourse(accessToken, String(user._id));

      const res = await request(app).get('/api/v1/courses');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("shows a teacher their own unpublished course alongside published ones", async () => {
      const { accessToken, user } = await createUserFixture('teacher');
      await createPublishedCourse(accessToken, String(user._id));

      const res = await request(app)
        .get('/api/v1/courses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.pagination).toEqual({ page: 1, limit: 20, total: 1 });
    });
  });

  describe('PATCH /courses/:courseId', () => {
    it('rejects updates from a teacher who does not own the course', async () => {
      const owner = await createUserFixture('teacher', 'owner');
      const stranger = await createUserFixture('teacher', 'stranger');
      const course = await createPublishedCourse(owner.accessToken, String(owner.user._id));

      const res = await request(app)
        .patch(`/api/v1/courses/${course.id}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .send({ isPublished: true });

      expect(res.status).toBe(403);
    });

    it('lets the owning teacher publish the course', async () => {
      const owner = await createUserFixture('teacher', 'owner');
      const course = await createPublishedCourse(owner.accessToken, String(owner.user._id));

      const res = await request(app)
        .patch(`/api/v1/courses/${course.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ isPublished: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isPublished).toBe(true);
    });
  });

  describe('Topics, resources, assignments, learning paths', () => {
    it('supports the full authoring flow for the owning teacher', async () => {
      const owner = await createUserFixture('teacher', 'owner');
      const course = await createPublishedCourse(owner.accessToken, String(owner.user._id));
      const auth = { Authorization: `Bearer ${owner.accessToken}` };

      const topicRes = await request(app)
        .post(`/api/v1/courses/${course.id}/topics`)
        .set(auth)
        .send({ title: 'Linear Equations', order: 1 });
      expect(topicRes.status).toBe(201);
      const topicId = topicRes.body.data.id;

      const listTopicsRes = await request(app).get(`/api/v1/courses/${course.id}/topics`);
      expect(listTopicsRes.status).toBe(200);
      expect(listTopicsRes.body.data).toHaveLength(1);

      const resourceRes = await request(app)
        .post(`/api/v1/topics/${topicId}/resources`)
        .set(auth)
        .send({ type: 'link', title: 'Khan Academy', url: 'https://example.com/khan' });
      expect(resourceRes.status).toBe(201);

      const assignmentRes = await request(app)
        .post(`/api/v1/courses/${course.id}/assignments`)
        .set(auth)
        .field('title', 'Homework 1')
        .field('description', 'Solve problems 1-10')
        .field('dueAt', new Date(Date.now() + 86400000).toISOString());
      expect(assignmentRes.status).toBe(201);
      expect(assignmentRes.body.data.attachmentUrl).toBeUndefined();

      const pathRes = await request(app)
        .post(`/api/v1/courses/${course.id}/learning-paths`)
        .set(auth)
        .send({ title: 'Foundations', topicSequence: [topicId] });
      expect(pathRes.status).toBe(201);

      const invalidPathRes = await request(app)
        .post(`/api/v1/courses/${course.id}/learning-paths`)
        .set(auth)
        .send({ title: 'Bad Path', topicSequence: ['64a0000000000000000000aa'] });
      expect(invalidPathRes.status).toBe(400);

      const deleteTopicRes = await request(app)
        .delete(`/api/v1/topics/${topicId}`)
        .set(auth);
      expect(deleteTopicRes.status).toBe(204);
    });
  });

  describe('Enrollments', () => {
    it('enrolls a student, prevents duplicates, and supports self-drop', async () => {
      const owner = await createUserFixture('teacher', 'owner');
      const student = await createUserFixture('student', 'learner');
      const course = await createPublishedCourse(owner.accessToken, String(owner.user._id));
      const teacherAuth = { Authorization: `Bearer ${owner.accessToken}` };

      const enrollRes = await request(app)
        .post(`/api/v1/courses/${course.id}/enrollments`)
        .set(teacherAuth)
        .send({ studentId: String(student.user._id) });
      expect(enrollRes.status).toBe(201);

      const duplicateRes = await request(app)
        .post(`/api/v1/courses/${course.id}/enrollments`)
        .set(teacherAuth)
        .send({ studentId: String(student.user._id) });
      expect(duplicateRes.status).toBe(409);

      const rosterRes = await request(app)
        .get(`/api/v1/courses/${course.id}/enrollments`)
        .set(teacherAuth);
      expect(rosterRes.status).toBe(200);
      expect(rosterRes.body.data).toHaveLength(1);

      const meRes = await request(app)
        .get('/api/v1/enrollments/me')
        .set('Authorization', `Bearer ${student.accessToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data).toHaveLength(1);

      const enrollmentId = enrollRes.body.data.id;
      const dropRes = await request(app)
        .patch(`/api/v1/enrollments/${enrollmentId}`)
        .set('Authorization', `Bearer ${student.accessToken}`)
        .send({ status: 'dropped' });
      expect(dropRes.status).toBe(200);
      expect(dropRes.body.data.status).toBe('dropped');
    });

    it('prevents a student from setting another status than dropped on their own enrollment', async () => {
      const owner = await createUserFixture('teacher', 'owner');
      const student = await createUserFixture('student', 'learner');
      const course = await createPublishedCourse(owner.accessToken, String(owner.user._id));

      const enrollRes = await request(app)
        .post(`/api/v1/courses/${course.id}/enrollments`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ studentId: String(student.user._id) });

      const res = await request(app)
        .patch(`/api/v1/enrollments/${enrollRes.body.data.id}`)
        .set('Authorization', `Bearer ${student.accessToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(403);
    });
  });
});
