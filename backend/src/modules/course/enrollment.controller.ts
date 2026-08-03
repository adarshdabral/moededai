import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { enrollmentService } from './enrollment.service';
import { CreateEnrollmentInput, UpdateEnrollmentStatusInput } from './course.validation';

export class EnrollmentController {
  async enroll(req: Request, res: Response): Promise<void> {
    const enrollment = await enrollmentService.enroll(
      req.params.courseId,
      req.user!,
      req.body as CreateEnrollmentInput
    );
    sendSuccess(res, enrollmentService.toDTO(enrollment), 201);
  }

  async listRoster(req: Request, res: Response): Promise<void> {
    const roster = await enrollmentService.listRoster(req.params.courseId, req.user!);
    sendSuccess(res, roster.map((enrollment) => enrollmentService.toDTO(enrollment)));
  }

  async listMine(req: Request, res: Response): Promise<void> {
    const enrollments = await enrollmentService.listMine(req.user!.id);
    sendSuccess(res, enrollments.map((enrollment) => enrollmentService.toDTO(enrollment)));
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const enrollment = await enrollmentService.updateStatus(
      req.params.enrollmentId,
      req.user!,
      req.body as UpdateEnrollmentStatusInput
    );
    sendSuccess(res, enrollmentService.toDTO(enrollment));
  }
}

export const enrollmentController = new EnrollmentController();
