import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';
import { emailClient } from '../../src/common/email';

const app = createApp();

function extractToken(body: string): string {
  const match = body.match(/token is: (\S+)/);
  if (!match) throw new Error(`Could not find token in email body: ${body}`);
  return match[1];
}

describe('Auth flows', () => {
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

  const validRegistration = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'CorrectHorse123',
    gradeLevel: 'Grade 10',
  };

  describe('POST /auth/register', () => {
    it('creates a student account and returns a token pair', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validRegistration);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'student',
        isEmailVerified: false,
      });
      expect(res.body.data.user.anonymousId).toMatch(/^anon_/);
      expect(typeof res.body.data.tokens.accessToken).toBe('string');
      expect(typeof res.body.data.tokens.refreshToken).toBe('string');
    });

    it('rejects a duplicate email with 409 Conflict', async () => {
      await request(app).post('/api/v1/auth/register').send(validRegistration);
      const res = await request(app).post('/api/v1/auth/register').send(validRegistration);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('rejects an invalid payload with 400 Validation Error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'A', email: 'not-an-email', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });

    it('never allows a client-supplied role to escalate privilege', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validRegistration, role: 'admin' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('student');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validRegistration);
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validRegistration.email, password: validRegistration.password });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(validRegistration.email);
    });

    it('rejects an incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validRegistration.email, password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects an unknown email with 401 (no user enumeration)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'WhoKnows123' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh and /auth/logout', () => {
    it('rotates the refresh token and invalidates the old one', async () => {
      const registerRes = await request(app).post('/api/v1/auth/register').send(validRegistration);
      const { refreshToken } = registerRes.body.data.tokens;

      const refreshRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.refreshToken).not.toBe(refreshToken);

      const reuseRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
      expect(reuseRes.status).toBe(401);
    });

    it('revokes the refresh token on logout', async () => {
      const registerRes = await request(app).post('/api/v1/auth/register').send(validRegistration);
      const { refreshToken } = registerRes.body.data.tokens;

      const logoutRes = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
      expect(logoutRes.status).toBe(204);

      const refreshRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
      expect(refreshRes.status).toBe(401);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('verifies the account with the token sent at registration', async () => {
      const sendSpy = jest.spyOn(emailClient, 'send');
      await request(app).post('/api/v1/auth/register').send(validRegistration);
      const token = extractToken(sendSpy.mock.calls[0][0].body);

      const verifyRes = await request(app).post('/api/v1/auth/verify-email').send({ token });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.verified).toBe(true);

      const reuseRes = await request(app).post('/api/v1/auth/verify-email').send({ token });
      expect(reuseRes.status).toBe(400);
    });
  });

  describe('Password reset flow', () => {
    it('resets the password and revokes existing sessions', async () => {
      const registerRes = await request(app).post('/api/v1/auth/register').send(validRegistration);
      const oldRefreshToken = registerRes.body.data.tokens.refreshToken;

      const sendSpy = jest.spyOn(emailClient, 'send');
      await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: validRegistration.email });
      const token = extractToken(sendSpy.mock.calls[0][0].body);

      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'BrandNewPassword123' });
      expect(resetRes.status).toBe(200);

      const oldRefreshAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });
      expect(oldRefreshAttempt.status).toBe(401);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validRegistration.email, password: 'BrandNewPassword123' });
      expect(loginRes.status).toBe(200);
    });

    it('returns success without leaking whether an email is registered', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({ email: 'ghost@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.data.requested).toBe(true);
    });
  });
});
