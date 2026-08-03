import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { doubtService } from './doubt.service';
import { CreateDoubtInput, DoubtListQuery, UpdateDoubtStatusInput } from './doubt.validation';

export class DoubtController {
  async post(req: Request, res: Response): Promise<void> {
    const doubt = await doubtService.post(req.user!, req.body as CreateDoubtInput);
    sendSuccess(res, doubtService.toDTO(doubt), 201);
  }

  async listByCourse(req: Request, res: Response): Promise<void> {
    const { status } = req.query as unknown as DoubtListQuery;
    const doubts = await doubtService.listByCourse(req.params.courseId, req.user!, status);
    sendSuccess(res, doubts.map((doubt) => doubtService.toDTO(doubt)));
  }

  async listMine(req: Request, res: Response): Promise<void> {
    const doubts = await doubtService.listMine(req.user!);
    sendSuccess(res, doubts.map((doubt) => doubtService.toDTO(doubt)));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const doubt = await doubtService.getById(req.params.doubtId);
    await doubtService.ensureCanAccessDoubt(doubt, req.user!);
    sendSuccess(res, doubtService.toDTO(doubt));
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const doubt = await doubtService.updateStatus(
      req.params.doubtId,
      req.user!,
      req.body as UpdateDoubtStatusInput
    );
    sendSuccess(res, doubtService.toDTO(doubt));
  }
}

export const doubtController = new DoubtController();
