import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { doubtReplyService } from './doubtReply.service';
import { CreateReplyInput } from './doubt.validation';

export class DoubtReplyController {
  async create(req: Request, res: Response): Promise<void> {
    const reply = await doubtReplyService.create(
      req.params.doubtId,
      req.user!,
      req.body as CreateReplyInput
    );
    sendSuccess(res, doubtReplyService.toDTO(reply), 201);
  }

  async listByDoubt(req: Request, res: Response): Promise<void> {
    const replies = await doubtReplyService.listByDoubt(req.params.doubtId, req.user!);
    sendSuccess(res, replies.map((reply) => doubtReplyService.toDTO(reply)));
  }
}

export const doubtReplyController = new DoubtReplyController();
