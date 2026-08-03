import { z } from 'zod';

export const generateTestSchema = z.object({
  topicId: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']).default('medium'),
  questionCount: z.number().int().min(1).max(20).default(5),
  timeLimitMinutes: z.number().int().min(1).max(180).default(20),
});
export type GenerateTestInput = z.infer<typeof generateTestSchema>;

/** Validates the AI provider's raw JSON output before it is ever persisted or trusted. */
export const generatedQuestionSchema = z.object({
  type: z.enum(['mcq', 'subjective']),
  prompt: z.string().min(1),
  options: z.array(z.string()).min(2).max(6).optional(),
  correctAnswer: z.string().min(1),
  points: z.number().min(0),
});

export const generatedQuizSchema = z.object({
  questions: z
    .array(generatedQuestionSchema)
    .min(1)
    .refine((questions) => Math.round(questions.reduce((sum, q) => sum + q.points, 0)) === 100, {
      message: 'Question points must sum to exactly 100.',
    })
    .refine(
      (questions) => questions.every((q) => q.type !== 'mcq' || (q.options?.length ?? 0) >= 2),
      { message: 'Every mcq question must include at least 2 options.' }
    ),
});
export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>;

export const startAttemptSchema = z.object({
  testId: z.string().min(1),
});
export type StartAttemptInput = z.infer<typeof startAttemptSchema>;

export const submitAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionIndex: z.number().int().min(0),
        response: z.string().min(1).max(4000),
      })
    )
    .min(1),
});
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
