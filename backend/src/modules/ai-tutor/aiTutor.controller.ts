import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { aiTutorService } from './aiTutor.service';
import { ListConversationsQuery, SendMessageInput, StartConversationInput } from './aiTutor.validation';

export class AiTutorController {
  async start(req: Request, res: Response): Promise<void> {
    const conversation = await aiTutorService.start(req.user!, req.body as StartConversationInput);
    sendSuccess(res, aiTutorService.toDetailDTO(conversation), 201);
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    const { message } = req.body as SendMessageInput;
    const conversation = await aiTutorService.sendMessage(req.params.conversationId, req.user!, message);
    sendSuccess(res, aiTutorService.toDetailDTO(conversation));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const conversation = await aiTutorService.getById(req.params.conversationId, req.user!);
    sendSuccess(res, aiTutorService.toDetailDTO(conversation));
  }

  async listMine(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListConversationsQuery;
    const { items, pagination } = await aiTutorService.listMine(req.user!, query);
    sendSuccess(res, items.map((conversation) => aiTutorService.toSummaryDTO(conversation)), 200, pagination);
  }
}

export const aiTutorController = new AiTutorController();
