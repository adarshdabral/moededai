import { Schema, model, Document, Model, Types } from 'mongoose';

export type QuestionType = 'mcq' | 'subjective';
export type TestDifficulty = 'easy' | 'medium' | 'hard' | 'adaptive';
export type GenerationSource = 'ai' | 'manual';

export interface TestQuestion {
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface AiGeneratedTestDocument extends Document {
  topicId: Types.ObjectId;
  generatedFor?: Types.ObjectId;
  difficulty: TestDifficulty;
  timeLimitMinutes: number;
  questions: TestQuestion[];
  generationSource: GenerationSource;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<TestQuestion>(
  {
    type: { type: String, enum: ['mcq', 'subjective'], required: true },
    prompt: { type: String, required: true },
    options: {
      type: [String],
      validate: {
        validator: function (this: TestQuestion, value: string[]) {
          if (this.type !== 'mcq') return true;
          return value.length >= 2 && value.length <= 6;
        },
        message: 'MCQ questions must have between 2 and 6 options.',
      },
    },
    correctAnswer: { type: String, required: true },
    points: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const aiGeneratedTestSchema = new Schema<AiGeneratedTestDocument>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    generatedFor: { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'adaptive'], required: true },
    timeLimitMinutes: { type: Number, required: true, min: 1 },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (value: TestQuestion[]) =>
          value.length > 0 && value.reduce((sum, q) => sum + q.points, 0) === 100,
        message: 'Question points must sum to exactly 100.',
      },
    },
    generationSource: { type: String, enum: ['ai', 'manual'], required: true, default: 'ai' },
  },
  { timestamps: true, collection: 'ai_generated_tests' }
);

export const AiGeneratedTestModel: Model<AiGeneratedTestDocument> = model<AiGeneratedTestDocument>(
  'AiGeneratedTest',
  aiGeneratedTestSchema
);
