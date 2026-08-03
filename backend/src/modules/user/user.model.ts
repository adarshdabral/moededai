import { Schema, model, Document, Model } from 'mongoose';
import { ALL_ROLES, Role } from '@common/constants/roles';

export interface UserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  anonymousId: string;
  isEmailVerified: boolean;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, required: true, index: true },
    anonymousId: { type: String, required: true, unique: true, immutable: true },
    isEmailVerified: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    avatarUrl: { type: String },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, collection: 'users' }
);

export const UserModel: Model<UserDocument> = model<UserDocument>('User', userSchema);
