import { Schema, model, Document, Model, Types } from 'mongoose';

export type VerificationTokenType = 'email_verification' | 'password_reset';

export interface VerificationTokenDocument extends Document {
  userId: Types.ObjectId;
  type: VerificationTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const verificationTokenSchema = new Schema<VerificationTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['email_verification', 'password_reset'], required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true, collection: 'verification_tokens' }
);

verificationTokenSchema.index({ userId: 1, type: 1 });
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationTokenModel: Model<VerificationTokenDocument> =
  model<VerificationTokenDocument>('VerificationToken', verificationTokenSchema);
