import { Schema, model, Document, Model, Types } from 'mongoose';

export interface KnowledgeScoreDocument extends Document {
  studentId: Types.ObjectId;
  topicId: Types.ObjectId;
  currentScore: number;
  attemptsCount: number;
  lastUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeScoreSchema = new Schema<KnowledgeScoreDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    currentScore: { type: Number, required: true, default: 0, min: 0, max: 100 },
    attemptsCount: { type: Number, required: true, default: 0, min: 0 },
    lastUpdatedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true, collection: 'knowledge_scores' }
);

knowledgeScoreSchema.index({ studentId: 1, topicId: 1 }, { unique: true });

export const KnowledgeScoreModel: Model<KnowledgeScoreDocument> = model<KnowledgeScoreDocument>(
  'KnowledgeScore',
  knowledgeScoreSchema
);
