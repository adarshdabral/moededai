import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { toSkipLimit, buildPaginationMeta } from '@common/utils/pagination';
import { adminIdentityService } from './adminIdentity.service';
import { ListAuditLogsQuery, ResolveIdentityInput } from './admin.validation';

export class AdminController {
  async resolveIdentity(req: Request, res: Response): Promise<void> {
    const { anonymousId, reason } = req.body as ResolveIdentityInput;
    const identity = await adminIdentityService.resolveAnonymousIdentity(
      anonymousId,
      req.user!.id,
      reason
    );
    sendSuccess(res, identity);
  }

  async listAuditLogs(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListAuditLogsQuery;
    const { skip, limit } = toSkipLimit(query);
    const { items, total } = await adminIdentityService.listAuditLogs({ skip, limit });
    sendSuccess(
      res,
      items.map((log) => adminIdentityService.toAuditDTO(log)),
      200,
      buildPaginationMeta(query, total)
    );
  }
}

export const adminController = new AdminController();
