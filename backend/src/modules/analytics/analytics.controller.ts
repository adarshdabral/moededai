import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { analyticsService } from './analytics.service';

export class AnalyticsController {
  async getMyGrowth(req: Request, res: Response): Promise<void> {
    const growth = await analyticsService.getMyGrowth(req.user!);
    sendSuccess(res, growth);
  }

  async getCourseComparative(req: Request, res: Response): Promise<void> {
    const comparative = await analyticsService.getCourseComparative(req.params.courseId, req.user!);
    sendSuccess(res, comparative);
  }
}

export const analyticsController = new AnalyticsController();
