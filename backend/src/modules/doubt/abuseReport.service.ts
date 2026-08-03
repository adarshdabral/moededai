import { NotFoundError, ValidationError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { buildPaginationMeta, PaginationQuery, toSkipLimit } from '@common/utils/pagination';
import { auditLogRepository, AuditLogRepository } from '@modules/admin/auditLog.repository';
import { doubtService, DoubtService } from './doubt.service';
import { doubtReplyService, DoubtReplyService } from './doubtReply.service';
import { abuseReportRepository, AbuseReportRepository } from './abuseReport.repository';
import { AbuseReportDocument } from './abuseReport.model';
import { AbuseReportDTO } from './doubt.types';
import { CreateAbuseReportInput, ResolveAbuseReportInput } from './doubt.validation';

export class AbuseReportService {
  constructor(
    private readonly repository: AbuseReportRepository = abuseReportRepository,
    private readonly doubts: DoubtService = doubtService,
    private readonly replies: DoubtReplyService = doubtReplyService,
    private readonly auditLogs: AuditLogRepository = auditLogRepository
  ) {}

  toDTO(report: AbuseReportDocument): AbuseReportDTO {
    return {
      id: String(report._id),
      reportedDoubtId: report.reportedDoubtId ? String(report.reportedDoubtId) : undefined,
      reportedReplyId: report.reportedReplyId ? String(report.reportedReplyId) : undefined,
      reportedByUserId: String(report.reportedByUserId),
      reason: report.reason,
      status: report.status,
      resolvedByAdminId: report.resolvedByAdminId ? String(report.resolvedByAdminId) : undefined,
      resolutionNotes: report.resolutionNotes,
    };
  }

  async create(
    requester: AuthenticatedUser,
    input: CreateAbuseReportInput
  ): Promise<AbuseReportDocument> {
    if (input.reportedDoubtId) {
      await this.doubts.getById(input.reportedDoubtId);
    } else if (input.reportedReplyId) {
      await this.replies.getById(input.reportedReplyId);
    }

    return this.repository.create({
      reportedDoubtId: input.reportedDoubtId as unknown as AbuseReportDocument['reportedDoubtId'],
      reportedReplyId: input.reportedReplyId as unknown as AbuseReportDocument['reportedReplyId'],
      reportedByUserId: requester.id as unknown as AbuseReportDocument['reportedByUserId'],
      reason: input.reason,
      status: 'pending',
    });
  }

  async list(query: { page: number; limit: number }) {
    const { skip, limit } = toSkipLimit(query as PaginationQuery);
    const [items, total] = await Promise.all([
      this.repository.findPendingFirst({ skip, limit }),
      this.repository.count(),
    ]);
    return { items, pagination: buildPaginationMeta(query as PaginationQuery, total) };
  }

  async resolve(
    reportId: string,
    requester: AuthenticatedUser,
    input: ResolveAbuseReportInput
  ): Promise<AbuseReportDocument> {
    const report = await this.repository.findById(reportId);
    if (!report) throw new NotFoundError('Abuse report');
    if (report.status === 'resolved' || report.status === 'dismissed') {
      throw new ValidationError('This report has already been resolved.');
    }

    const updated = await this.repository.updateById(reportId, {
      $set: {
        status: input.status,
        resolvedByAdminId: requester.id,
        resolutionNotes: input.resolutionNotes,
      },
    });
    if (!updated) throw new NotFoundError('Abuse report');

    await this.auditLogs.create({
      actorAdminId: requester.id,
      action: 'REPORT_RESOLVED',
      targetType: 'abuse_reports',
      targetId: reportId,
      reason: input.resolutionNotes ?? `Report marked ${input.status}`,
    });

    return updated;
  }
}

export const abuseReportService = new AbuseReportService();
