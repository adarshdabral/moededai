import { AuthenticatedUser } from '@common/types/express';
import { NotFoundError, ValidationError } from '@common/errors/AppError';
import { aiClient } from '@ai/index';
import {
  QUIZ_GENERATION_SYSTEM_INSTRUCTION,
  buildQuizGenerationPrompt,
} from '@ai/prompts/testGeneration.prompts';
import { topicService, TopicService } from '@modules/course/topic.service';
import {
  aiGeneratedTestRepository,
  AiGeneratedTestRepository,
} from './aiGeneratedTest.repository';
import { AiGeneratedTestDocument } from './aiGeneratedTest.model';
import { AiGeneratedTestDTO } from './aiTest.types';
import { generatedQuizSchema } from './aiTest.validation';
import { GenerateTestInput } from './aiTest.validation';

export class AiTestService {
  constructor(
    private readonly repository: AiGeneratedTestRepository = aiGeneratedTestRepository,
    private readonly topics: TopicService = topicService
  ) {}

  /** Never returns `correctAnswer` to the client - that would let a student cheat. */
  toPublicDTO(test: AiGeneratedTestDocument): AiGeneratedTestDTO {
    return {
      id: String(test._id),
      topicId: String(test.topicId),
      difficulty: test.difficulty,
      timeLimitMinutes: test.timeLimitMinutes,
      questions: test.questions.map((q) => ({
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        points: q.points,
      })),
    };
  }

  async generate(
    requester: AuthenticatedUser,
    input: GenerateTestInput
  ): Promise<AiGeneratedTestDocument> {
    const topic = await this.topics.getById(input.topicId);

    const prompt = buildQuizGenerationPrompt({
      topicTitle: topic.title,
      learningObjectives: topic.learningObjectives,
      difficulty: input.difficulty,
      questionCount: input.questionCount,
    });

    const raw = await aiClient.generateJSON(prompt, QUIZ_GENERATION_SYSTEM_INSTRUCTION);
    const parsed = generatedQuizSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ValidationError(
        'The AI provider returned a quiz that failed validation.',
        parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), issue: issue.message }))
      );
    }

    return this.repository.create({
      topicId: input.topicId as unknown as AiGeneratedTestDocument['topicId'],
      generatedFor: requester.id as unknown as AiGeneratedTestDocument['generatedFor'],
      difficulty: input.difficulty,
      timeLimitMinutes: input.timeLimitMinutes,
      questions: parsed.data.questions,
      generationSource: 'ai',
    });
  }

  async getById(testId: string): Promise<AiGeneratedTestDocument> {
    const test = await this.repository.findById(testId);
    if (!test) throw new NotFoundError('Test');
    return test;
  }
}

export const aiTestService = new AiTestService();
