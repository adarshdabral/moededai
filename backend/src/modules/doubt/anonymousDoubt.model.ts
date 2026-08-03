import { Schema, model, Document, Model, Types } from 'mongoose';

export type DoubtStatus = 'open' | 'answered' | 'closed';

export interface AnonymousDoubtDocument extends Document {
  authorAnonymousId: string;
  courseId: Types.ObjectId;
  topicId?: Types.ObjectId;
  question: string;
  status: DoubtStatus;
  createdAt: Date;
  updatedAt: Date;
}

const anonymousDoubtSchema = new Schema<AnonymousDoubtDocument>(
  {
    // Intentionally a plain string, NOT `ref: 'User'` - this collection must
    // never be joinable back to a real identity. See docs/ARCHITECTURE.md §8.
    authorAnonymousId: { type: String, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    question: { type: String, required: true, minlength: 1, maxlength: 2000 },
    status: { type: String, enum: ['open', 'answered', 'closed'], required: true, default: 'open' },
  },
  { timestamps: true, collection: 'anonymous_doubts' }
);

anonymousDoubtSchema.index({ courseId: 1, status: 1 });

export const AnonymousDoubtModel: Model<AnonymousDoubtDocument> = model<AnonymousDoubtDocument>(
  'AnonymousDoubt',
  anonymousDoubtSchema
);
