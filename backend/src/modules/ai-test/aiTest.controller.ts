import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { aiTestService } from './aiTest.service';
import { GenerateTestInput } from './aiTest.validation';

export class AiTestController {
  async generate(req: Request, res: Response): Promise<void> {
    const test = await aiTestService.generate(req.user!, req.body as GenerateTestInput);
    sendSuccess(res, aiTestService.toPublicDTO(test), 201);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const test = await aiTestService.getById(req.params.testId);
    sendSuccess(res, aiTestService.toPublicDTO(test));
  }
}

export const aiTestController = new AiTestController();
