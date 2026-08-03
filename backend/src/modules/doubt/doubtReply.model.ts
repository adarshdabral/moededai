import { Schema, model, Document, Model, Types } from 'mongoose';

export type ReplyAuthorRole = 'teacher' | 'anonymous_student';

export interface DoubtReplyDocument extends Document {
  doubtId: Types.ObjectId;
  authorRole: ReplyAuthorRole;
  /**
   * The teacher's real `userId` (string) when authorRole is 'teacher', or the
   * poster's `anonymousId` when authorRole is 'anonymous_student' - NEVER the
   * reverse. See docs/ARCHITECTURE.md §8.
   */
  authorRef: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const doubtReplySchema = new Schema<DoubtReplyDocument>(
  {
    doubtId: { type: Schema.Types.ObjectId, ref: 'AnonymousDoubt', required: true, index: true },
    authorRole: { type: String, enum: ['teacher', 'anonymous_student'], required: true },
    authorRef: { type: String, required: true },
    message: { type: String, required: true, minlength: 1, maxlength: 2000 },
  },
  { timestamps: true, collection: 'doubt_replies' }
);

doubtReplySchema.index({ doubtId: 1, createdAt: 1 });

export const DoubtReplyModel: Model<DoubtReplyDocument> = model<DoubtReplyDocument>(
  'DoubtReply',
  doubtReplySchema
);
