import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../setup/testDb';
import { createUserFixture, createTopicFixture } from '../setup/fixtures';
import { aiClient } from '../../src/ai';

const app = createApp();

const TWO_MCQ_QUIZ = {
  questions: [
    { type: 'mcq', prompt: 'What is 1/2 + 1/2?', options: ['1', '2'], correctAnswer: '1', points: 50 },
    { type: 'mcq', prompt: 'What is the numerator in 3/4?', options: ['3', '4'], correctAnswer: '3', points: 50 },
  ],
};

const ONE_SUBJECTIVE_QUIZ = {
  questions: [
    {
      type: 'subjective',
      prompt: 'Explain what a fraction represents.',
      correctAnswer: 'A part of a whole, expressed as numerator over denominator.',
      points: 100,
    },
  ],
};

async function generateTest(studentToken: string, topicId: string) {
  const res = await request(app)
    .post('/api/v1/ai-test/generate')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ topicId, difficulty: 'medium', questionCount: 2, timeLimitMinutes: 15 });
  return res;
}

describe('AI Test Generation, Attempts, and Knowledge Score', () => {
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

  describe('POST /ai-test/generate', () => {
    it('generates a quiz and never exposes correctAnswer to the client', async () => {
      jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
      const { topic } = await createTopicFixture();
      const { accessToken } = await createUserFixture('student');

      const res = await generateTest(accessToken, String(topic._id));

      expect(res.status).toBe(201);
      expect(res.body.data.questions).toHaveLength(2);
      expect(res.body.data.questions[0]).not.toHaveProperty('correctAnswer');
      expect(res.body.data.questions[0].points).toBe(50);
    });

    it('rejects AI output whose points do not sum to 100', async () => {
      jest.spyOn(aiClient, 'generateJSON').mockResolvedValue({
        questions: [{ type: 'mcq', prompt: 'Bad', options: ['A', 'B'], correctAnswer: 'A', points: 40 }],
      });
      const { topic } = await createTopicFixture();
      const { accessToken } = await createUserFixture('student');

      const res = await generateTest(accessToken, String(topic._id));
      expect(res.status).toBe(400);
    });
  });

  describe('Attempt lifecycle and scoring', () => {
    it('scores a fully-correct attempt at 100 and updates the Knowledge Score', async () => {
      jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
      const { topic } = await createTopicFixture();
      const { accessToken } = await createUserFixture('student');

      const testRes = await generateTest(accessToken, String(topic._id));
      const testId = testRes.body.data.id;

      const startRes = await request(app)
        .post('/api/v1/test-attempts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ testId });
      expect(startRes.status).toBe(201);
      const attemptId = startRes.body.data.id;

      const submitRes = await request(app)
        .patch(`/api/v1/test-attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          answers: [
            { questionIndex: 0, response: '1' },
            { questionIndex: 1, response: '3' },
          ],
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.score).toBe(100);
      expect(submitRes.body.data.weakTopicsIdentified).toEqual([]);

      const scoresRes = await request(app)
        .get('/api/v1/knowledge-scores/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(scoresRes.status).toBe(200);
      expect(scoresRes.body.data).toEqual([
        expect.objectContaining({ topicId: String(topic._id), currentScore: 100, attemptsCount: 1 }),
      ]);
    });

    it('scores a partially-wrong attempt below 60 and surfaces it as a weak topic', async () => {
      jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
      const { topic } = await createTopicFixture();
      const { accessToken } = await createUserFixture('student');

      const testRes = await generateTest(accessToken, String(topic._id));
      const startRes = await request(app)
        .post('/api/v1/test-attempts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ testId: testRes.body.data.id });

      const submitRes = await request(app)
        .patch(`/api/v1/test-attempts/${startRes.body.data.id}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          answers: [
            { questionIndex: 0, response: '1' },
            { questionIndex: 1, response: 'wrong' },
          ],
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.score).toBe(50);
      expect(submitRes.body.data.weakTopicsIdentified).toEqual([topic.title]);

      const weakRes = await request(app)
        .get('/api/v1/knowledge-scores/me/weak-topics')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(weakRes.status).toBe(200);
      expect(weakRes.body.data).toHaveLength(1);
    });

    it('rejects resubmitting an already-submitted attempt', async () => {
      jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
      const { topic } = await createTopicFixture();
      const { accessToken } = await createUserFixture('student');

      const testRes = await generateTest(accessToken, String(topic._id));
      const startRes = await request(app)
        .post('/api/v1/test-attempts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ testId: testRes.body.data.id });

      const answers = {
        answers: [
          { questionIndex: 0, response: '1' },
          { questionIndex: 1, response: '3' },
        ],
      };
      await request(app)
        .patch(`/api/v1/test-attempts/${startRes.body.data.id}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(answers);

      const secondSubmit = await request(app)
        .patch(`/api/v1/test-attempts/${startRes.body.data.id}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(answers);

      expect(secondSubmit.status).toBe(400);
    });

    it("prevents a student from accessing another student's attempt", async () => {
      jest.spyOn(aiClient, 'generateJSON').mockResolvedValue(TWO_MCQ_QUIZ);
      const { topic } = await createTopicFixture();
      const owner = await createUserFixture('student', 'owner');
      const stranger = await createUserFixture('student', 'stranger');

      const testRes = await generateTest(owner.accessToken, String(topic._id));
      const startRes = await request(app)
        .post('/api/v1/test-attempts')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ testId: testRes.body.data.id });

      const res = await request(app)
        .get(`/api/v1/test-attempts/${startRes.body.data.id}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`);

      expect(res.status).toBe(403);
    });

    it('grades subjective questions via the AI client and clamps points to the question max', async () => {
      const generateJSONSpy = jest
        .spyOn(aiClient, 'generateJSON')
        .mockResolvedValueOnce(ONE_SUBJECTIVE_QUIZ)
        .mockResolvedValueOnce({ pointsAwarded: 150, feedback: 'Mostly correct.' });

      const { topic } = await createTopicFixture();
      const { accessToken } = await createUserFixture('student');

      const testRes = await generateTest(accessToken, String(topic._id));
      const startRes = await request(app)
        .post('/api/v1/test-attempts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ testId: testRes.body.data.id });

      const submitRes = await request(app)
        .patch(`/api/v1/test-attempts/${startRes.body.data.id}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ answers: [{ questionIndex: 0, response: 'It is a part of a whole.' }] });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.score).toBe(100); // clamped from 150 to the question's max (100)
      expect(generateJSONSpy).toHaveBeenCalledTimes(2);
    });
  });
});
