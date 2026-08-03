import { Schema, model, Document, Model, Types } from 'mongoose';

export type AttemptType = 'practice' | 'monthly_assessment';

export interface AttemptAnswer {
  questionIndex: number;
  response: string;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface TestAttemptDocument extends Document {
  testId: Types.ObjectId;
  studentId: Types.ObjectId;
  attemptType: AttemptType;
  monthlyAssessmentId?: Types.ObjectId;
  answers: AttemptAnswer[];
  score: number;
  weakTopicsIdentified: string[];
  startedAt: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<AttemptAnswer>(
  {
    questionIndex: { type: Number, required: true, min: 0 },
    response: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    pointsAwarded: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const testAttemptSchema = new Schema<TestAttemptDocument>(
  {
    testId: { type: Schema.Types.ObjectId, ref: 'AiGeneratedTest', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attemptType: { type: String, enum: ['practice', 'monthly_assessment'], required: true },
    monthlyAssessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'MonthlyAssessment',
      validate: {
        validator: function (this: TestAttemptDocument, value: Types.ObjectId | undefined) {
          return this.attemptType === 'monthly_assessment' ? Boolean(value) : true;
        },
        message: 'monthlyAssessmentId is required when attemptType is monthly_assessment.',
      },
    },
    answers: { type: [answerSchema], required: true, default: [] },
    score: { type: Number, required: true, default: 0, min: 0, max: 100 },
    weakTopicsIdentified: [{ type: String }],
    startedAt: { type: Date, required: true, default: () => new Date() },
    submittedAt: { type: Date },
  },
  { timestamps: true, collection: 'test_attempts' }
);

testAttemptSchema.index({ studentId: 1, submittedAt: -1 });
testAttemptSchema.index({ monthlyAssessmentId: 1 }, { sparse: true });

export const TestAttemptModel: Model<TestAttemptDocument> = model<TestAttemptDocument>(
  'TestAttempt',
  testAttemptSchema
);
