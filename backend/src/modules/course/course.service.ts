import { ForbiddenError, NotFoundError, ValidationError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { ROLES } from '@common/constants/roles';
import { buildPaginationMeta, PaginationQuery, toSkipLimit } from '@common/utils/pagination';
import { userService, UserService } from '@modules/user/user.service';
import { courseRepository, CourseRepository } from './course.repository';
import { CourseDocument } from './course.model';
import { CourseDTO } from './course.types';
import { CourseListQuery, CreateCourseInput, UpdateCourseInput } from './course.validation';

export class CourseService {
  constructor(
    private readonly repository: CourseRepository = courseRepository,
    private readonly users: UserService = userService
  ) {}

  toDTO(course: CourseDocument): CourseDTO {
    return {
      id: String(course._id),
      title: course.title,
      description: course.description,
      subject: course.subject,
      gradeLevel: course.gradeLevel,
      teacherIds: course.teacherIds.map(String),
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  /** Throws ForbiddenError unless the requester is an admin or a teacher assigned to the course. */
  async ensureCanManageCourse(courseId: string, requester: AuthenticatedUser): Promise<void> {
    if (requester.role === ROLES.ADMIN) return;
    if (requester.role === ROLES.TEACHER) {
      const isOwner = await this.repository.isTeacherOfCourse(courseId, requester.id);
      if (isOwner) return;
    }
    throw new ForbiddenError('You do not manage this course.');
  }

  async createCourse(requester: AuthenticatedUser, input: CreateCourseInput): Promise<CourseDocument> {
    let teacherIds = input.teacherIds;

    if (requester.role === ROLES.TEACHER) {
      // A teacher can only ever create a course owned by themselves.
      teacherIds = [requester.id];
    } else {
      for (const teacherId of teacherIds) {
        const teacher = await this.users.getById(teacherId);
        if (teacher.role !== ROLES.TEACHER) {
          throw new ValidationError(`User ${teacherId} is not a teacher.`);
        }
      }
    }

    return this.repository.create({
      ...input,
      teacherIds,
    } as unknown as Partial<CourseDocument>);
  }

  async getById(courseId: string): Promise<CourseDocument> {
    const course = await this.repository.findById(courseId);
    if (!course) throw new NotFoundError('Course');
    return course;
  }

  /** Used by the Teacher Portal (GET /teacher/classes) - cross-module, via this public method. */
  async listMine(teacherId: string): Promise<CourseDocument[]> {
    return this.repository.find({ teacherIds: teacherId }, { sort: { createdAt: -1 } });
  }

  async list(
    query: CourseListQuery,
    requester?: AuthenticatedUser
  ): Promise<{ items: CourseDocument[]; total: number }> {
    const { skip, limit } = toSkipLimit(query);
    const filter: Record<string, unknown> = {};
    if (query.subject) filter.subject = query.subject;
    if (query.gradeLevel) filter.gradeLevel = query.gradeLevel;

    // Students (and unauthenticated callers) only ever see published courses.
    // Teachers see published courses plus their own drafts. Admins see all.
    if (!requester || requester.role === ROLES.STUDENT) {
      filter.isPublished = true;
    } else if (requester.role === ROLES.TEACHER) {
      filter.$or = [{ isPublished: true }, { teacherIds: requester.id }];
    }

    const [items, total] = await Promise.all([
      this.repository.find(filter, { skip, limit, sort: { createdAt: -1 } }),
      this.repository.count(filter),
    ]);
    return { items, total };
  }

  async update(
    courseId: string,
    requester: AuthenticatedUser,
    updates: UpdateCourseInput
  ): Promise<CourseDocument> {
    await this.ensureCanManageCourse(courseId, requester);

    if (updates.teacherIds) {
      for (const teacherId of updates.teacherIds) {
        const teacher = await this.users.getById(teacherId);
        if (teacher.role !== ROLES.TEACHER) {
          throw new ValidationError(`User ${teacherId} is not a teacher.`);
        }
      }
    }

    const updated = await this.repository.updateById(courseId, { $set: updates });
    if (!updated) throw new NotFoundError('Course');
    return updated;
  }

  async buildPagination(query: CourseListQuery, total: number) {
    return buildPaginationMeta(query as unknown as PaginationQuery, total);
  }
}

export const courseService = new CourseService();
