import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';
import { createUserFixture, createTopicFixture } from '../setup/fixtures';
import { AuditLogModel } from '../../src/modules/admin/auditLog.model';

const app = createApp();

async function postDoubt(studentToken: string, courseId: string, question = 'Why does 1/2 = 2/4?') {
  return request(app)
    .post('/api/v1/doubts')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ courseId, question });
}

describe('Anonymous Doubts & Identity Protection', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  it('lets a student post an anonymous doubt tagged with their own anonymousId', async () => {
    const { course } = await createTopicFixture();
    const student = await createUserFixture('student');

    const res = await postDoubt(student.accessToken, String(course._id));

    expect(res.status).toBe(201);
    expect(res.body.data.authorAnonymousId).toBe(student.user.anonymousId);
    expect(res.body.data).not.toHaveProperty('authorUserId');
  });

  it('SECURITY: the teacher inbox never contains the author\'s real name or email', async () => {
    const { teacher, course } = await createTopicFixture();
    const student = await createUserFixture('student', 'secretidentity');

    await postDoubt(student.accessToken, String(course._id), 'A very sensitive question');

    const res = await request(app)
      .get(`/api/v1/courses/${course._id}/doubts`)
      .set('Authorization', `Bearer ${teacher.accessToken}`);

    expect(res.status).toBe(200);
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(student.user.name);
    expect(serialized).not.toContain(student.user.email);
    expect(serialized).not.toContain(String(student.user._id));
    expect(serialized).toContain(student.user.anonymousId);
  });

  it('rejects a non-owning teacher from viewing the course doubt inbox', async () => {
    const { course } = await createTopicFixture();
    const stranger = await createUserFixture('teacher', 'stranger');

    const res = await request(app)
      .get(`/api/v1/courses/${course._id}/doubts`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(res.status).toBe(403);
  });

  it("lets a student see their own posted doubts via /doubts/me", async () => {
    const { course } = await createTopicFixture();
    const student = await createUserFixture('student');
    await postDoubt(student.accessToken, String(course._id));

    const res = await request(app)
      .get('/api/v1/doubts/me')
      .set('Authorization', `Bearer ${student.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('prevents an unrelated student from reading a doubt that is not theirs', async () => {
    const { course } = await createTopicFixture();
    const author = await createUserFixture('student', 'author');
    const stranger = await createUserFixture('student', 'strangerstudent');
    const postRes = await postDoubt(author.accessToken, String(course._id));

    const res = await request(app)
      .get(`/api/v1/doubts/${postRes.body.data.id}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('supports teacher and anonymous-author replies, correctly tagging each authorRef', async () => {
    const { teacher, course } = await createTopicFixture();
    const student = await createUserFixture('student');
    const postRes = await postDoubt(student.accessToken, String(course._id));
    const doubtId = postRes.body.data.id;

    const teacherReply = await request(app)
      .post(`/api/v1/doubts/${doubtId}/replies`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({ message: 'Great question - let me explain.' });
    expect(teacherReply.status).toBe(201);
    expect(teacherReply.body.data.authorRole).toBe('teacher');
    expect(teacherReply.body.data.authorRef).toBe(String(teacher.user._id));

    const studentReply = await request(app)
      .post(`/api/v1/doubts/${doubtId}/replies`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ message: 'Thanks, that clears it up!' });
    expect(studentReply.status).toBe(201);
    expect(studentReply.body.data.authorRole).toBe('anonymous_student');
    expect(studentReply.body.data.authorRef).toBe(student.user.anonymousId);

    const threadRes = await request(app)
      .get(`/api/v1/doubts/${doubtId}/replies`)
      .set('Authorization', `Bearer ${teacher.accessToken}`);
    expect(threadRes.body.data).toHaveLength(2);

    const statusRes = await request(app)
      .patch(`/api/v1/doubts/${doubtId}/status`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({ status: 'answered' });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('answered');
  });

  it('records the real reporter identity (not anonymous) when filing an abuse report', async () => {
    const { course } = await createTopicFixture();
    const student = await createUserFixture('student');
    const reporter = await createUserFixture('student', 'reporter');
    const postRes = await postDoubt(student.accessToken, String(course._id));

    const reportRes = await request(app)
      .post(`/api/v1/doubts/${postRes.body.data.id}/report`)
      .set('Authorization', `Bearer ${reporter.accessToken}`)
      .send({ reason: 'This contains inappropriate content.' });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.data.reportedByUserId).toBe(String(reporter.user._id));
    expect(reportRes.body.data.status).toBe('pending');
  });

  it('rejects non-admins from listing or resolving abuse reports', async () => {
    const teacher = await createUserFixture('teacher');
    const listRes = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${teacher.accessToken}`);
    expect(listRes.status).toBe(403);
  });

  it('lets an admin list and resolve an abuse report, writing an audit log entry', async () => {
    const { course } = await createTopicFixture();
    const student = await createUserFixture('student');
    const admin = await createUserFixture('admin');
    const postRes = await postDoubt(student.accessToken, String(course._id));

    const reportRes = await request(app)
      .post(`/api/v1/doubts/${postRes.body.data.id}/report`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ reason: 'Reporting my own post as a test.' });

    const listRes = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    const resolveRes = await request(app)
      .patch(`/api/v1/admin/reports/${reportRes.body.data.id}/resolve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'dismissed', resolutionNotes: 'Not a violation.' });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe('dismissed');

    const auditEntries = await AuditLogModel.find({ action: 'REPORT_RESOLVED' }).exec();
    expect(auditEntries).toHaveLength(1);
    expect(String(auditEntries[0].actorAdminId)).toBe(String(admin.user._id));
  });

  describe('SECURITY: admin-only audited identity resolution', () => {
    it('rejects a non-admin from resolving an anonymous identity', async () => {
      const student = await createUserFixture('student');
      const teacher = await createUserFixture('teacher');

      const res = await request(app)
        .post('/api/v1/admin/identity/resolve')
        .set('Authorization', `Bearer ${teacher.accessToken}`)
        .send({ anonymousId: student.user.anonymousId, reason: 'Investigating a flagged report.' });

      expect(res.status).toBe(403);
    });

    it('lets an admin resolve an anonymous identity and always writes an audit log first', async () => {
      const { course } = await createTopicFixture();
      const student = await createUserFixture('student', 'toberesolved');
      const admin = await createUserFixture('admin');
      await postDoubt(student.accessToken, String(course._id));

      const res = await request(app)
        .post('/api/v1/admin/identity/resolve')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          anonymousId: student.user.anonymousId,
          reason: 'Investigating an abuse report against this anonymous ID.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        userId: String(student.user._id),
        name: student.user.name,
        email: student.user.email,
        anonymousId: student.user.anonymousId,
      });

      const auditEntries = await AuditLogModel.find({ action: 'IDENTITY_RESOLVED' }).exec();
      expect(auditEntries).toHaveLength(1);
      expect(String(auditEntries[0].actorAdminId)).toBe(String(admin.user._id));
      expect(auditEntries[0].reason).toContain('Investigating an abuse report');
    });

    it('rejects resolution of an unknown anonymousId with 404', async () => {
      const admin = await createUserFixture('admin');

      const res = await request(app)
        .post('/api/v1/admin/identity/resolve')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ anonymousId: 'anon_DOESNOTEXIST0000', reason: 'Testing an unknown ID lookup.' });

      expect(res.status).toBe(404);
    });

    it('rejects a resolution request with too short a reason (accountability requirement)', async () => {
      const admin = await createUserFixture('admin');
      const student = await createUserFixture('student');

      const res = await request(app)
        .post('/api/v1/admin/identity/resolve')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ anonymousId: student.user.anonymousId, reason: 'short' });

      expect(res.status).toBe(400);
    });
  });
});
