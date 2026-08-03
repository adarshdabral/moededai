import { BaseRepository } from '@database/baseRepository';
import { CourseDocument, CourseModel } from './course.model';

export class CourseRepository extends BaseRepository<CourseDocument> {
  constructor() {
    super(CourseModel);
  }

  async isTeacherOfCourse(courseId: string, teacherId: string): Promise<boolean> {
    const count = await CourseModel.countDocuments({ _id: courseId, teacherIds: teacherId }).exec();
    return count > 0;
  }
}

export const courseRepository = new CourseRepository();
