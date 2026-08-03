import { AuditAction, AuditLogDocument, AuditLogModel } from './auditLog.model';

export interface CreateAuditLogInput {
  actorAdminId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export class AuditLogRepository {
  /** The only write method - audit logs are append-only by omission (no update/delete). */
  async create(input: CreateAuditLogInput): Promise<AuditLogDocument> {
    return AuditLogModel.create(input);
  }

  async list(options: { skip?: number; limit?: number }): Promise<AuditLogDocument[]> {
    return AuditLogModel.find({})
      .sort({ createdAt: -1 })
      .skip(options.skip ?? 0)
      .limit(options.limit ?? 20)
      .lean<AuditLogDocument[]>()
      .exec();
  }

  async count(): Promise<number> {
    return AuditLogModel.countDocuments({}).exec();
  }
}

export const auditLogRepository = new AuditLogRepository();
