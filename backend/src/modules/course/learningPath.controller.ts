import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { learningPathService } from './learningPath.service';
import { CreateLearningPathInput } from './course.validation';

export class LearningPathController {
  async create(req: Request, res: Response): Promise<void> {
    const path = await learningPathService.create(
      req.params.courseId,
      req.user!,
      req.body as CreateLearningPathInput
    );
    sendSuccess(res, learningPathService.toDTO(path), 201);
  }

  async listByCourse(req: Request, res: Response): Promise<void> {
    const paths = await learningPathService.listByCourse(req.params.courseId);
    sendSuccess(res, paths.map((path) => learningPathService.toDTO(path)));
  }
}

export const learningPathController = new LearningPathController();
