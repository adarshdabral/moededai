import { ForbiddenError, NotFoundError, ValidationError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { buildPaginationMeta, PaginationQuery, toSkipLimit } from '@common/utils/pagination';
import { aiClient } from '@ai/index';
import { GRADING_SYSTEM_INSTRUCTION, buildGradingPrompt } from '@ai/prompts/testGeneration.prompts';
import { topicService, TopicService } from '@modules/course/topic.service';
import { knowledgeScoreService, KnowledgeScoreService } from '@modules/knowledge-score/knowledgeScore.service';
import { notificationService, NotificationService } from '@modules/notification/notification.service';
import { aiGeneratedTestRepository, AiGeneratedTestRepository } from './aiGeneratedTest.repository';
import { testAttemptRepository, TestAttemptRepository } from './testAttempt.repository';
import { AttemptAnswer, TestAttemptDocument } from './testAttempt.model';
import { TestQuestion } from './aiGeneratedTest.model';
import { TestAttemptDTO } from './aiTest.types';
import { SubmitAttemptInput } from './aiTest.validation';
import { gradingResultSchema } from './grading.validation';

const WEAK_TOPIC_SCORE_THRESHOLD = 60;
const SUBJECTIVE_CORRECT_RATIO = 0.7;

export class TestAttemptService {
  constructor(
    private readonly repository: TestAttemptRepository = testAttemptRepository,
    private readonly tests: AiGeneratedTestRepository = aiGeneratedTestRepository,
    private readonly topics: TopicService = topicService,
    private readonly knowledgeScores: KnowledgeScoreService = knowledgeScoreService,
    private readonly notifications: NotificationService = notificationService
  ) {}

  toDTO(attempt: TestAttemptDocument): TestAttemptDTO {
    return {
      id: String(attempt._id),
      testId: String(attempt.testId),
      studentId: String(attempt.studentId),
      attemptType: attempt.attemptType,
      score: attempt.score,
      weakTopicsIdentified: attempt.weakTopicsIdentified,
      answers: attempt.answers,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    };
  }

  async start(requester: AuthenticatedUser, testId: string): Promise<TestAttemptDocument> {
    const test = await this.tests.findById(testId);
    if (!test) throw new NotFoundError('Test');

    return this.repository.create({
      testId: testId as unknown as TestAttemptDocument['testId'],
      studentId: requester.id as unknown as TestAttemptDocument['studentId'],
      attemptType: 'practice',
      answers: [],
      score: 0,
      weakTopicsIdentified: [],
      startedAt: new Date(),
    });
  }

  /** Used only by AssessmentService when a student begins their monthly assessment attempt. */
  async startForMonthlyAssessment(
    requester: AuthenticatedUser,
    testId: string,
    monthlyAssessmentId: string
  ): Promise<TestAttemptDocument> {
    const test = await this.tests.findById(testId);
    if (!test) throw new NotFoundError('Test');

    return this.repository.create({
      testId: testId as unknown as TestAttemptDocument['testId'],
      studentId: requester.id as unknown as TestAttemptDocument['studentId'],
      attemptType: 'monthly_assessment',
      monthlyAssessmentId: monthlyAssessmentId as unknown as TestAttemptDocument['monthlyAssessmentId'],
      answers: [],
      score: 0,
      weakTopicsIdentified: [],
      startedAt: new Date(),
    });
  }

  private async getOwned(
    attemptId: string,
    requester: AuthenticatedUser
  ): Promise<TestAttemptDocument> {
    const attempt = await this.repository.findById(attemptId);
    if (!attempt) throw new NotFoundError('Test attempt');
    if (String(attempt.studentId) !== requester.id) {
      throw new ForbiddenError('This attempt does not belong to you.');
    }
    return attempt;
  }

  private async gradeQuestion(
    question: TestQuestion,
    response: string
  ): Promise<{ isCorrect: boolean; pointsAwarded: number }> {
    if (question.type === 'mcq') {
      const isCorrect =
        response.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
    }

    const prompt = buildGradingPrompt({
      questionPrompt: question.prompt,
      modelAnswer: question.correctAnswer,
      studentResponse: response,
      maxPoints: question.points,
    });
    const raw = await aiClient.generateJSON(prompt, GRADING_SYSTEM_INSTRUCTION);
    const parsed = gradingResultSchema.parse(raw);
    const pointsAwarded = Math.max(0, Math.min(question.points, parsed.pointsAwarded));
    return {
      isCorrect: pointsAwarded >= question.points * SUBJECTIVE_CORRECT_RATIO,
      pointsAwarded,
    };
  }

  async submit(
    attemptId: string,
    requester: AuthenticatedUser,
    input: SubmitAttemptInput
  ): Promise<TestAttemptDocument> {
    const attempt = await this.getOwned(attemptId, requester);
    if (attempt.submittedAt) {
      throw new ValidationError('This attempt has already been submitted.');
    }

    const test = await this.tests.findById(String(attempt.testId));
    if (!test) throw new NotFoundError('Test');

    const answeredIndexes = new Set(input.answers.map((a) => a.questionIndex));
    if (answeredIndexes.size !== test.questions.length) {
      throw new ValidationError('All questions must be answered exactly once.');
    }

    const gradedAnswers: AttemptAnswer[] = [];
    for (const answer of input.answers) {
      const question = test.questions[answer.questionIndex];
      if (!question) {
        throw new ValidationError(`Invalid questionIndex: ${answer.questionIndex}`);
      }
      const graded = await this.gradeQuestion(question, answer.response);
      gradedAnswers.push({
        questionIndex: answer.questionIndex,
        response: answer.response,
        ...graded,
      });
    }

    const score = gradedAnswers.reduce((sum, a) => sum + a.pointsAwarded, 0);
    const topic = await this.topics.getById(String(test.topicId));
    const weakTopicsIdentified = score < WEAK_TOPIC_SCORE_THRESHOLD ? [topic.title] : [];

    const updated = await this.repository.updateById(attemptId, {
      $set: {
        answers: gradedAnswers,
        score,
        weakTopicsIdentified,
        submittedAt: new Date(),
      },
    });
    if (!updated) throw new NotFoundError('Test attempt');

    await this.knowledgeScores.recordAttempt(
      requester.id,
      String(test.topicId),
      attemptId,
      score
    );

    await this.notifications.notify(
      requester.id,
      'score_update',
      `Your score for "${topic.title}"`,
      `You scored ${score}/100 on your ${attempt.attemptType === 'monthly_assessment' ? 'monthly assessment' : 'practice test'} for "${topic.title}".`
    );

    return updated;
  }

  async getById(attemptId: string, requester: AuthenticatedUser): Promise<TestAttemptDocument> {
    return this.getOwned(attemptId, requester);
  }

  async listMine(requester: AuthenticatedUser, query: { page: number; limit: number }) {
    const { skip, limit } = toSkipLimit(query as PaginationQuery);
    const [items, total] = await Promise.all([
      this.repository.findByStudent(requester.id, { skip, limit }),
      this.repository.countByStudent(requester.id),
    ]);
    return { items, pagination: buildPaginationMeta(query as PaginationQuery, total) };
  }
}

export const testAttemptService = new TestAttemptService();
