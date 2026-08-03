import { NotFoundError } from '@common/errors/AppError';
import { userService, UserService } from '@modules/user/user.service';
import {
  anonymousIdentityMapRepository,
  AnonymousIdentityMapRepository,
} from './anonymousIdentityMap.repository';
import { auditLogRepository, AuditLogRepository } from './auditLog.repository';
import { AuditLogDocument } from './auditLog.model';
import { AuditLogDTO, ResolvedIdentityDTO } from './admin.types';

export class AdminIdentityService {
  constructor(
    private readonly identityMap: AnonymousIdentityMapRepository = anonymousIdentityMapRepository,
    private readonly auditLogs: AuditLogRepository = auditLogRepository,
    private readonly users: UserService = userService
  ) {}

  /** Called once, transactionally alongside user creation - see AuthService.register. */
  async createMapping(userId: string, anonymousId: string): Promise<void> {
    await this.identityMap.create(userId, anonymousId);
  }

  toAuditDTO(log: AuditLogDocument): AuditLogDTO {
    return {
      id: String(log._id),
      actorAdminId: String(log.actorAdminId),
      action: log.action,
      targetType: log.targetType,
      targetId: String(log.targetId),
      reason: log.reason,
      createdAt: log.createdAt,
    };
  }

  /**
   * The ONLY code path in the entire system permitted to resolve an
   * anonymousId back to a real identity. Every call is audited - there is no
   * way to read the result of this method without an audit_logs entry being
   * written first. See docs/ARCHITECTURE.md §8 and CLAUDE.md §10/§19.
   */
  async resolveAnonymousIdentity(
    anonymousId: string,
    requestingAdminId: string,
    reason: string
  ): Promise<ResolvedIdentityDTO> {
    const mapping = await this.identityMap.findByAnonymousId(anonymousId);
    if (!mapping) {
      throw new NotFoundError('Anonymous identity mapping');
    }

    const user = await this.users.getById(String(mapping.userId));

    await this.auditLogs.create({
      actorAdminId: requestingAdminId,
      action: 'IDENTITY_RESOLVED',
      targetType: 'anonymous_identity_map',
      targetId: String(mapping._id),
      reason,
      metadata: { anonymousId },
    });

    return {
      userId: String(user._id),
      name: user.name,
      email: user.email,
      anonymousId,
    };
  }

  async listAuditLogs(options: { skip?: number; limit?: number }) {
    const [items, total] = await Promise.all([
      this.auditLogs.list(options),
      this.auditLogs.count(),
    ]);
    return { items, total };
  }
}

export const adminIdentityService = new AdminIdentityService();
