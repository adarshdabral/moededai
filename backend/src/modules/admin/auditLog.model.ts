import { Schema, model, Document, Model, Types } from 'mongoose';

export type AuditAction =
  | 'IDENTITY_RESOLVED'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_REACTIVATED'
  | 'REPORT_RESOLVED'
  | 'ROLE_CHANGED';

export interface AuditLogDocument extends Document {
  actorAdminId: Types.ObjectId;
  action: AuditAction;
  targetType: string;
  targetId: Types.ObjectId;
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actorAdminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: ['IDENTITY_RESOLVED', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_REACTIVATED', 'REPORT_RESOLVED', 'ROLE_CHANGED'],
      required: true,
      index: true,
    },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, minlength: 1, maxlength: 1000 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'audit_logs' }
);

// No repository method exists to update or delete an audit log - append-only
// by omission. See docs/DATABASE.md §20.

export const AuditLogModel: Model<AuditLogDocument> = model<AuditLogDocument>(
  'AuditLog',
  auditLogSchema
);
