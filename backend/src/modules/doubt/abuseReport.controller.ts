import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { abuseReportService } from './abuseReport.service';
import { CreateAbuseReportInput, ResolveAbuseReportInput } from './doubt.validation';

export class AbuseReportController {
  async create(req: Request, res: Response): Promise<void> {
    const report = await abuseReportService.create(req.user!, req.body as CreateAbuseReportInput);
    sendSuccess(res, abuseReportService.toDTO(report), 201);
  }

  async list(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const { items, pagination } = await abuseReportService.list({ page, limit });
    sendSuccess(res, items.map((report) => abuseReportService.toDTO(report)), 200, pagination);
  }

  async resolve(req: Request, res: Response): Promise<void> {
    const report = await abuseReportService.resolve(
      req.params.reportId,
      req.user!,
      req.body as ResolveAbuseReportInput
    );
    sendSuccess(res, abuseReportService.toDTO(report));
  }
}

export const abuseReportController = new AbuseReportController();
