interface QuizGenerationContext {
  topicTitle: string;
  learningObjectives: string[];
  difficulty: string;
  questionCount: number;
}

export const QUIZ_GENERATION_SYSTEM_INSTRUCTION =
  'You are an expert curriculum assessment designer for a K-12 education platform. ' +
  'You always respond with a single JSON object matching exactly the schema you are given, ' +
  'with no surrounding prose or markdown formatting.';

/**
 * Builds the prompt for AI-generated quizzes. Kept isolated from
 * ai-test.service.ts so prompt engineering changes never touch business
 * logic - see docs/ARCHITECTURE.md §7.
 */
export function buildQuizGenerationPrompt(context: QuizGenerationContext): string {
  return [
    `Generate a ${context.difficulty}-difficulty quiz on the topic "${context.topicTitle}".`,
    context.learningObjectives.length > 0
      ? `Learning objectives: ${context.learningObjectives.join('; ')}.`
      : '',
    `Produce exactly ${context.questionCount} questions, mixing "mcq" and "subjective" types.`,
    'Respond with JSON matching this exact shape:',
    '{ "questions": [ { "type": "mcq" | "subjective", "prompt": string, ' +
      '"options": string[] (only for type "mcq", 2-6 entries), "correctAnswer": string, ' +
      '"points": number } ] }',
    'The "points" values across all questions MUST sum to exactly 100.',
    'For "mcq" questions, "correctAnswer" must exactly match one of the "options".',
    'For "subjective" questions, "correctAnswer" should be a brief model answer/rubric used for grading.',
  ]
    .filter(Boolean)
    .join(' ');
}

interface GradingContext {
  questionPrompt: string;
  modelAnswer: string;
  studentResponse: string;
  maxPoints: number;
}

export const GRADING_SYSTEM_INSTRUCTION =
  'You are grading a student short-answer response against a model answer/rubric. ' +
  'You always respond with a single JSON object matching exactly the schema you are given, ' +
  'with no surrounding prose or markdown formatting.';

export function buildGradingPrompt(context: GradingContext): string {
  return [
    `Question: ${context.questionPrompt}`,
    `Model answer / rubric: ${context.modelAnswer}`,
    `Student response: ${context.studentResponse}`,
    `Maximum points available: ${context.maxPoints}.`,
    'Respond with JSON matching this exact shape:',
    `{ "pointsAwarded": number (0 to ${context.maxPoints}), "feedback": string (one short sentence) }`,
  ].join(' ');
}
