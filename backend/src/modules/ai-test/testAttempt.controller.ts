import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { testAttemptService } from './testAttempt.service';
import { StartAttemptInput, SubmitAttemptInput } from './aiTest.validation';

export class TestAttemptController {
  async start(req: Request, res: Response): Promise<void> {
    const { testId } = req.body as StartAttemptInput;
    const attempt = await testAttemptService.start(req.user!, testId);
    sendSuccess(res, testAttemptService.toDTO(attempt), 201);
  }

  async submit(req: Request, res: Response): Promise<void> {
    const attempt = await testAttemptService.submit(
      req.params.attemptId,
      req.user!,
      req.body as SubmitAttemptInput
    );
    sendSuccess(res, testAttemptService.toDTO(attempt));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const attempt = await testAttemptService.getById(req.params.attemptId, req.user!);
    sendSuccess(res, testAttemptService.toDTO(attempt));
  }

  async listMine(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const { items, pagination } = await testAttemptService.listMine(req.user!, { page, limit });
    sendSuccess(res, items.map((attempt) => testAttemptService.toDTO(attempt)), 200, pagination);
  }
}

export const testAttemptController = new TestAttemptController();
