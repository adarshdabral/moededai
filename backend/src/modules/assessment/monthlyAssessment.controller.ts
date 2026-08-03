import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { testAttemptService } from '@modules/ai-test/testAttempt.service';
import { monthlyAssessmentService } from './monthlyAssessment.service';
import { ScheduleMonthlyAssessmentInput } from './monthlyAssessment.validation';

export class MonthlyAssessmentController {
  async schedule(req: Request, res: Response): Promise<void> {
    const assessment = await monthlyAssessmentService.schedule(
      req.params.courseId,
      req.user!,
      req.body as ScheduleMonthlyAssessmentInput
    );
    sendSuccess(res, monthlyAssessmentService.toDTO(assessment), 201);
  }

  async listByCourse(req: Request, res: Response): Promise<void> {
    const assessments = await monthlyAssessmentService.listByCourse(req.params.courseId, req.user!);
    sendSuccess(res, assessments.map((a) => monthlyAssessmentService.toDTO(a)));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const assessment = await monthlyAssessmentService.getById(req.params.assessmentId);
    sendSuccess(res, monthlyAssessmentService.toDTO(assessment));
  }

  async startMyAttempt(req: Request, res: Response): Promise<void> {
    const attempt = await monthlyAssessmentService.startMyAttempt(req.params.assessmentId, req.user!);
    sendSuccess(res, testAttemptService.toDTO(attempt), 201);
  }
}

export const monthlyAssessmentController = new MonthlyAssessmentController();
