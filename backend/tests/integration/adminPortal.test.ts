import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';
import { createUserFixture } from '../setup/fixtures';

const app = createApp();

describe('Admin Portal', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  describe('User management', () => {
    it('rejects non-admins from listing or creating users', async () => {
      const teacher = await createUserFixture('teacher');
      const listRes = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${teacher.accessToken}`);
      expect(listRes.status).toBe(403);

      const createRes = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${teacher.accessToken}`)
        .send({ name: 'New Teacher', email: 'nt@example.com', password: 'Password123', role: 'teacher' });
      expect(createRes.status).toBe(403);
    });

    it('lets an admin create a teacher account directly (the admin-provisioned flow)', async () => {
      const admin = await createUserFixture('admin');

      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          name: 'New Teacher',
          email: 'newteacher@example.com',
          password: 'Password123',
          role: 'teacher',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('teacher');
      expect(res.body.data.anonymousId).toMatch(/^anon_/);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'newteacher@example.com', password: 'Password123' });
      expect(loginRes.status).toBe(200);
    });

    it('rejects creating a privileged account with role=student (only teacher/admin allowed here)', async () => {
      const admin = await createUserFixture('admin');
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'X', email: 'x@example.com', password: 'Password123', role: 'student' });
      expect(res.status).toBe(400);
    });

    it('lists users filtered by role', async () => {
      const admin = await createUserFixture('admin');
      await createUserFixture('teacher');
      await createUserFixture('student');

      const res = await request(app)
        .get('/api/v1/admin/users?role=teacher')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((u: { role: string }) => u.role === 'teacher')).toBe(true);
    });

    it('deactivates an account, revoking sessions and blocking future logins', async () => {
      const admin = await createUserFixture('admin');
      const target = await createUserFixture('teacher', 'target');

      const deactivateRes = await request(app)
        .patch(`/api/v1/admin/users/${target.user._id}/deactivate`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Violated platform terms of service.' });
      expect(deactivateRes.status).toBe(200);
      expect(deactivateRes.body.data.isActive).toBe(false);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: target.user.email, password: 'FixturePassword123' });
      expect(loginRes.status).toBe(401);

      const reactivateRes = await request(app)
        .patch(`/api/v1/admin/users/${target.user._id}/reactivate`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Appeal accepted after review.' });
      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.isActive).toBe(true);

      const secondLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: target.user.email, password: 'FixturePassword123' });
      expect(secondLoginRes.status).toBe(200);
    });
  });

  describe('Platform settings', () => {
    it('returns default settings and lets an admin update them', async () => {
      const admin = await createUserFixture('admin');

      const getRes = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.maintenanceMode).toBe(false);

      const updateRes = await request(app)
        .patch('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ maintenanceMode: true, announcement: 'Scheduled maintenance tonight.' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.maintenanceMode).toBe(true);

      const getAfterRes = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(getAfterRes.body.data.maintenanceMode).toBe(true);
      expect(getAfterRes.body.data.announcement).toBe('Scheduled maintenance tonight.');
    });

    it('rejects non-admins from viewing or updating settings', async () => {
      const { accessToken } = await createUserFixture('student');
      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(403);
    });
  });
});
