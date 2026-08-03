import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { courseService } from './course.service';
import { CourseListQuery, CreateCourseInput, UpdateCourseInput } from './course.validation';

export class CourseController {
  async create(req: Request, res: Response): Promise<void> {
    const course = await courseService.createCourse(req.user!, req.body as CreateCourseInput);
    sendSuccess(res, courseService.toDTO(course), 201);
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as CourseListQuery;
    const { items, total } = await courseService.list(query, req.user);
    const pagination = await courseService.buildPagination(query, total);
    sendSuccess(res, items.map((course) => courseService.toDTO(course)), 200, pagination);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const course = await courseService.getById(req.params.courseId);
    sendSuccess(res, courseService.toDTO(course));
  }

  async update(req: Request, res: Response): Promise<void> {
    const course = await courseService.update(
      req.params.courseId,
      req.user!,
      req.body as UpdateCourseInput
    );
    sendSuccess(res, courseService.toDTO(course));
  }
}

export const courseController = new CourseController();
