import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { assignmentService } from './assignment.service';
import { CreateAssignmentInput, UpdateAssignmentInput } from './course.validation';

export class AssignmentController {
  async create(req: Request, res: Response): Promise<void> {
    const assignment = await assignmentService.create(
      req.params.courseId,
      req.user!,
      req.body as CreateAssignmentInput,
      req.file
    );
    sendSuccess(res, assignmentService.toDTO(assignment), 201);
  }

  async listByCourse(req: Request, res: Response): Promise<void> {
    const assignments = await assignmentService.listByCourse(req.params.courseId);
    sendSuccess(res, assignments.map((assignment) => assignmentService.toDTO(assignment)));
  }

  async update(req: Request, res: Response): Promise<void> {
    const assignment = await assignmentService.update(
      req.params.assignmentId,
      req.user!,
      req.body as UpdateAssignmentInput
    );
    sendSuccess(res, assignmentService.toDTO(assignment));
  }

  async delete(req: Request, res: Response): Promise<void> {
    await assignmentService.delete(req.params.assignmentId, req.user!);
    res.status(204).send();
  }
}

export const assignmentController = new AssignmentController();
