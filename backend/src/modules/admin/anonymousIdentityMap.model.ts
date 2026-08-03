import { Schema, model, Document, Model, Types } from 'mongoose';

/**
 * The ONLY collection permitted to pair a real userId with an anonymousId.
 * Access is restricted to a single admin-only, audited service method
 * (AdminIdentityService.resolveAnonymousIdentity) - see docs/ARCHITECTURE.md §8
 * and CLAUDE.md §10. No repository method here is ever called from a
 * non-admin code path.
 */
export interface AnonymousIdentityMapDocument extends Document {
  userId: Types.ObjectId;
  anonymousId: string;
  createdAt: Date;
  updatedAt: Date;
}

const anonymousIdentityMapSchema = new Schema<AnonymousIdentityMapDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    anonymousId: { type: String, required: true, unique: true },
  },
  { timestamps: true, collection: 'anonymous_identity_map' }
);

export const AnonymousIdentityMapModel: Model<AnonymousIdentityMapDocument> =
  model<AnonymousIdentityMapDocument>('AnonymousIdentityMap', anonymousIdentityMapSchema);
