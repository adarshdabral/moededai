import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { topicService } from './topic.service';
import { CreateTopicInput, UpdateTopicInput } from './course.validation';

export class TopicController {
  async create(req: Request, res: Response): Promise<void> {
    const topic = await topicService.create(
      req.params.courseId,
      req.user!,
      req.body as CreateTopicInput
    );
    sendSuccess(res, topicService.toDTO(topic), 201);
  }

  async listByCourse(req: Request, res: Response): Promise<void> {
    const topics = await topicService.listByCourse(req.params.courseId);
    sendSuccess(res, topics.map((topic) => topicService.toDTO(topic)));
  }

  async update(req: Request, res: Response): Promise<void> {
    const topic = await topicService.update(
      req.params.topicId,
      req.user!,
      req.body as UpdateTopicInput
    );
    sendSuccess(res, topicService.toDTO(topic));
  }

  async delete(req: Request, res: Response): Promise<void> {
    await topicService.delete(req.params.topicId, req.user!);
    res.status(204).send();
  }
}

export const topicController = new TopicController();
