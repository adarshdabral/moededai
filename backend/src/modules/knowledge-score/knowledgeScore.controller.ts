import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { knowledgeScoreService } from './knowledgeScore.service';

export class KnowledgeScoreController {
  async listMine(req: Request, res: Response): Promise<void> {
    const scores = await knowledgeScoreService.listMine(req.user!.id);
    sendSuccess(res, scores.map((score) => knowledgeScoreService.toDTO(score)));
  }

  async listWeakTopics(req: Request, res: Response): Promise<void> {
    const scores = await knowledgeScoreService.listWeakTopics(req.user!.id);
    sendSuccess(res, scores.map((score) => knowledgeScoreService.toDTO(score)));
  }
}

export const knowledgeScoreController = new KnowledgeScoreController();
