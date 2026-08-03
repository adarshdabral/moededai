import { Schema, model, Document, Model, Types } from 'mongoose';

export interface LearningPathDocument extends Document {
  courseId: Types.ObjectId;
  title: string;
  topicSequence: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const learningPathSchema = new Schema<LearningPathDocument>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    topicSequence: [{ type: Schema.Types.ObjectId, ref: 'Topic', required: true }],
  },
  { timestamps: true, collection: 'learning_paths' }
);

export const LearningPathModel: Model<LearningPathDocument> = model<LearningPathDocument>(
  'LearningPath',
  learningPathSchema
);
