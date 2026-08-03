import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { courseService } from '@modules/course/course.service';
import { teacherService } from './teacher.service';

export class TeacherPortalController {
  async getMyClasses(req: Request, res: Response): Promise<void> {
    const courses = await teacherService.getMyClasses(req.user!.id);
    sendSuccess(res, courses.map((course) => courseService.toDTO(course)));
  }

  async getStudentAnalytics(req: Request, res: Response): Promise<void> {
    const analytics = await teacherService.getStudentAnalytics(req.user!.id, req.params.studentId);
    sendSuccess(res, analytics);
  }
}

export const teacherPortalController = new TeacherPortalController();
