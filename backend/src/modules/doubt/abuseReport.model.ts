import { Schema, model, Document, Model, Types } from 'mongoose';

export type AbuseReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface AbuseReportDocument extends Document {
  reportedDoubtId?: Types.ObjectId;
  reportedReplyId?: Types.ObjectId;
  reportedByUserId: Types.ObjectId;
  reason: string;
  status: AbuseReportStatus;
  resolvedByAdminId?: Types.ObjectId;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const abuseReportSchema = new Schema<AbuseReportDocument>(
  {
    reportedDoubtId: { type: Schema.Types.ObjectId, ref: 'AnonymousDoubt' },
    reportedReplyId: { type: Schema.Types.ObjectId, ref: 'DoubtReply' },
    // The reporter is intentionally NOT anonymous - accountability for reports.
    reportedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, minlength: 1, maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
      required: true,
      default: 'pending',
    },
    resolvedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionNotes: { type: String, maxlength: 1000 },
  },
  { timestamps: true, collection: 'abuse_reports' }
);

abuseReportSchema.pre('validate', function (next) {
  const hasDoubt = Boolean(this.reportedDoubtId);
  const hasReply = Boolean(this.reportedReplyId);
  if (hasDoubt === hasReply) {
    next(new Error('Exactly one of reportedDoubtId or reportedReplyId must be set.'));
    return;
  }
  next();
});

abuseReportSchema.index({ status: 1 });

export const AbuseReportModel: Model<AbuseReportDocument> = model<AbuseReportDocument>(
  'AbuseReport',
  abuseReportSchema
);
