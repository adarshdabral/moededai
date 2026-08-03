import { NotFoundError } from '@common/errors/AppError';
import { courseService, CourseService } from '@modules/course/course.service';
import { analyticsService, AnalyticsService } from '@modules/analytics/analytics.service';
import { CourseDocument } from '@modules/course/course.model';
import { GrowthAnalyticsDTO } from '@modules/analytics/analytics.types';
import { teacherRepository, TeacherRepository } from './teacher.repository';
import { TeacherProfileDocument } from './teacher.model';
import { CreateTeacherProfileInput } from './teacher.types';

export class TeacherService {
  constructor(
    private readonly repository: TeacherRepository = teacherRepository,
    private readonly courses: CourseService = courseService,
    private readonly analytics: AnalyticsService = analyticsService
  ) {}

  async createProfile(input: CreateTeacherProfileInput): Promise<TeacherProfileDocument> {
    return this.repository.create({
      userId: input.userId as unknown as TeacherProfileDocument['userId'],
      subjectSpecialization: input.subjectSpecialization ?? [],
    });
  }

  async getByUserId(userId: string): Promise<TeacherProfileDocument> {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundError('Teacher profile');
    return profile;
  }

  /** Teacher Portal: classes this teacher owns. */
  async getMyClasses(teacherId: string): Promise<CourseDocument[]> {
    return this.courses.listMine(teacherId);
  }

  /** Teacher Portal: a student's analytics, only if enrolled in one of this teacher's courses. */
  async getStudentAnalytics(teacherId: string, studentId: string): Promise<GrowthAnalyticsDTO> {
    return this.analytics.getStudentAnalyticsForTeacher(teacherId, studentId);
  }
}

export const teacherService = new TeacherService();
