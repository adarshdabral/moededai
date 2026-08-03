import { Schema, model, Document, Model, Types } from 'mongoose';

export type MonthlyAssessmentStatus = 'scheduled' | 'open' | 'closed';

export interface MonthlyAssessmentDocument extends Document {
  courseId: Types.ObjectId;
  topicId: Types.ObjectId;
  scheduledFor: Date;
  windowClosesAt: Date;
  generatedTestIds: Types.ObjectId[];
  status: MonthlyAssessmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const monthlyAssessmentSchema = new Schema<MonthlyAssessmentDocument>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    scheduledFor: { type: Date, required: true },
    windowClosesAt: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: MonthlyAssessmentDocument, value: Date) {
          return value.getTime() > this.scheduledFor.getTime();
        },
        message: 'windowClosesAt must be after scheduledFor.',
      },
    },
    generatedTestIds: [{ type: Schema.Types.ObjectId, ref: 'AiGeneratedTest' }],
    status: { type: String, enum: ['scheduled', 'open', 'closed'], required: true, default: 'scheduled' },
  },
  { timestamps: true, collection: 'monthly_assessments' }
);

monthlyAssessmentSchema.index({ courseId: 1, scheduledFor: 1 });

export const MonthlyAssessmentModel: Model<MonthlyAssessmentDocument> =
  model<MonthlyAssessmentDocument>('MonthlyAssessment', monthlyAssessmentSchema);
