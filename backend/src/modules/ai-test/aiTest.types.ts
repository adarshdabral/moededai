export interface QuestionPublicDTO {
  type: 'mcq' | 'subjective';
  prompt: string;
  options?: string[];
  points: number;
}

export interface AiGeneratedTestDTO {
  id: string;
  topicId: string;
  difficulty: string;
  timeLimitMinutes: number;
  questions: QuestionPublicDTO[];
}

export interface AttemptAnswerDTO {
  questionIndex: number;
  response: string;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface TestAttemptDTO {
  id: string;
  testId: string;
  studentId: string;
  attemptType: string;
  score: number;
  weakTopicsIdentified: string[];
  answers: AttemptAnswerDTO[];
  startedAt: Date;
  submittedAt?: Date;
}
