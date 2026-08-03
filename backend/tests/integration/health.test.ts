import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb } from '../setup/testDb';

describe('GET /api/v1/health', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('returns 200 with status ok when the database is connected', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: expect.objectContaining({ status: 'ok', database: 'connected' }),
    });
  });
});
