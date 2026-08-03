import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { UnprocessableEntityError } from '@common/errors/AppError';
import { resourceService } from './resource.service';
import { CreateLinkResourceInput } from './course.validation';

export class ResourceController {
  async createLink(req: Request, res: Response): Promise<void> {
    const resource = await resourceService.createLink(
      req.params.topicId,
      req.user!,
      req.body as CreateLinkResourceInput
    );
    sendSuccess(res, resourceService.toDTO(resource), 201);
  }

  async createUpload(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new UnprocessableEntityError('A file is required.');
    }
    const title = (req.body as { title?: string }).title ?? req.file.originalname;
    const resource = await resourceService.createUpload(
      req.params.topicId,
      req.user!,
      title,
      req.file
    );
    sendSuccess(res, resourceService.toDTO(resource), 201);
  }

  async listByTopic(req: Request, res: Response): Promise<void> {
    const resources = await resourceService.listByTopic(req.params.topicId);
    sendSuccess(res, resources.map((resource) => resourceService.toDTO(resource)));
  }

  async delete(req: Request, res: Response): Promise<void> {
    await resourceService.delete(req.params.resourceId, req.user!);
    res.status(204).send();
  }
}

export const resourceController = new ResourceController();
