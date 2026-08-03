import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';
import { createUserFixture } from '../setup/fixtures';
import { aiClient } from '../../src/ai';
import { AIProviderError } from '../../src/common/errors/AppError';

const app = createApp();

describe('AI Tutor', () => {
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

  it('rejects non-student roles with 403', async () => {
    const { accessToken } = await createUserFixture('teacher');
    const res = await request(app)
      .post('/api/v1/ai-tutor/conversations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it('starts a conversation, sends a message, and stores the mocked AI reply', async () => {
    jest.spyOn(aiClient, 'generateChatReply').mockResolvedValue('Great question! Let’s break it down.');
    const { accessToken } = await createUserFixture('student');

    const startRes = await request(app)
      .post('/api/v1/ai-tutor/conversations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(startRes.status).toBe(201);
    expect(startRes.body.data.messages).toEqual([]);
    const conversationId = startRes.body.data.id;

    const messageRes = await request(app)
      .post(`/api/v1/ai-tutor/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'What is a fraction?' });

    expect(messageRes.status).toBe(200);
    expect(messageRes.body.data.messages).toHaveLength(2);
    expect(messageRes.body.data.messages[0]).toMatchObject({
      role: 'student',
      content: 'What is a fraction?',
    });
    expect(messageRes.body.data.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Great question! Let’s break it down.',
    });
    expect(messageRes.body.data.title).toBe('What is a fraction?');
  });

  it('translates an AI provider failure into a 502 AIProviderError', async () => {
    jest.spyOn(aiClient, 'generateChatReply').mockRejectedValue(new AIProviderError());
    const { accessToken } = await createUserFixture('student');

    const startRes = await request(app)
      .post('/api/v1/ai-tutor/conversations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    const messageRes = await request(app)
      .post(`/api/v1/ai-tutor/conversations/${startRes.body.data.id}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'Hello' });

    expect(messageRes.status).toBe(502);
    expect(messageRes.body.error.code).toBe('AI_PROVIDER_ERROR');
  });

  it('prevents a student from accessing another student’s conversation', async () => {
    jest.spyOn(aiClient, 'generateChatReply').mockResolvedValue('Reply');
    const owner = await createUserFixture('student', 'owner');
    const stranger = await createUserFixture('student', 'stranger');

    const startRes = await request(app)
      .post('/api/v1/ai-tutor/conversations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({});

    const res = await request(app)
      .get(`/api/v1/ai-tutor/conversations/${startRes.body.data.id}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('lists the student’s own conversations, most recent first', async () => {
    jest.spyOn(aiClient, 'generateChatReply').mockResolvedValue('Reply');
    const { accessToken } = await createUserFixture('student');

    await request(app)
      .post('/api/v1/ai-tutor/conversations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    await request(app)
      .post('/api/v1/ai-tutor/conversations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    const res = await request(app)
      .get('/api/v1/ai-tutor/conversations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.pagination.total).toBe(2);
  });
});
