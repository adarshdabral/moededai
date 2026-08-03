import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';

const app = createApp();

async function registerAndLogin() {
  const registerRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    password: 'CompileThis123',
    gradeLevel: 'Grade 11',
  });
  return registerRes.body.data.tokens.accessToken as string;
}

describe('GET/PATCH /api/v1/users/me', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the authenticated user profile', async () => {
    const accessToken = await registerAndLogin();
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('grace@example.com');
  });

  it('rejects a malformed bearer token with 401', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('updates the profile name', async () => {
    const accessToken = await registerAndLogin();
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Grace B. Hopper' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Grace B. Hopper');
  });

  it('rejects an invalid profile update payload with 400', async () => {
    const accessToken = await registerAndLogin();
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ avatarUrl: 'not-a-url' });

    expect(res.status).toBe(400);
  });
});
