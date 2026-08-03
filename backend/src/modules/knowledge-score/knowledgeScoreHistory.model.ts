import { Schema, model, Document, Model, Types } from 'mongoose';

export interface KnowledgeScoreHistoryDocument extends Document {
  studentId: Types.ObjectId;
  topicId: Types.ObjectId;
  score: number;
  recordedAt: Date;
  triggeredBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeScoreHistorySchema = new Schema<KnowledgeScoreHistoryDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    recordedAt: { type: Date, required: true, default: () => new Date() },
    triggeredBy: { type: Schema.Types.ObjectId, ref: 'TestAttempt', required: true },
  },
  { timestamps: true, collection: 'knowledge_score_history' }
);

knowledgeScoreHistorySchema.index({ studentId: 1, topicId: 1, recordedAt: 1 });

export const KnowledgeScoreHistoryModel: Model<KnowledgeScoreHistoryDocument> =
  model<KnowledgeScoreHistoryDocument>('KnowledgeScoreHistory', knowledgeScoreHistorySchema);
