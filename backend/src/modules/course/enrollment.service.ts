import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { ROLES } from '@common/constants/roles';
import { userService, UserService } from '@modules/user/user.service';
import { courseService, CourseService } from './course.service';
import { enrollmentRepository, EnrollmentRepository } from './enrollment.repository';
import { EnrollmentDocument } from './enrollment.model';
import { EnrollmentDTO } from './course.types';
import { CreateEnrollmentInput, UpdateEnrollmentStatusInput } from './course.validation';

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

export class EnrollmentService {
  constructor(
    private readonly repository: EnrollmentRepository = enrollmentRepository,
    private readonly courses: CourseService = courseService,
    private readonly users: UserService = userService
  ) {}

  toDTO(enrollment: EnrollmentDocument): EnrollmentDTO {
    return {
      id: String(enrollment._id),
      studentId: String(enrollment.studentId),
      courseId: String(enrollment.courseId),
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
    };
  }

  async enroll(
    courseId: string,
    requester: AuthenticatedUser,
    input: CreateEnrollmentInput
  ): Promise<EnrollmentDocument> {
    await this.courses.ensureCanManageCourse(courseId, requester);

    const student = await this.users.getById(input.studentId);
    if (student.role !== ROLES.STUDENT) {
      throw new ValidationError(`User ${input.studentId} is not a student.`);
    }

    try {
      return await this.repository.create({
        courseId: courseId as unknown as EnrollmentDocument['courseId'],
        studentId: input.studentId as unknown as EnrollmentDocument['studentId'],
        status: 'active',
        enrolledAt: new Date(),
      });
    } catch (error) {
      if ((error as { code?: number }).code === MONGO_DUPLICATE_KEY_ERROR_CODE) {
        throw new ConflictError('This student is already enrolled in this course.');
      }
      throw error;
    }
  }

  async listRoster(courseId: string, requester: AuthenticatedUser): Promise<EnrollmentDocument[]> {
    await this.courses.ensureCanManageCourse(courseId, requester);
    return this.repository.findByCourse(courseId);
  }

  async listMine(studentId: string): Promise<EnrollmentDocument[]> {
    return this.repository.findByStudent(studentId);
  }

  /**
   * No auth check - for use by other modules (e.g. `assessment`) that have
   * already authorized the caller via `ensureCanManageCourse` themselves.
   */
  async listActiveByCourse(courseId: string): Promise<EnrollmentDocument[]> {
    const all = await this.repository.findByCourse(courseId);
    return all.filter((enrollment) => enrollment.status === 'active');
  }

  async updateStatus(
    enrollmentId: string,
    requester: AuthenticatedUser,
    input: UpdateEnrollmentStatusInput
  ): Promise<EnrollmentDocument> {
    const enrollment = await this.repository.findById(enrollmentId);
    if (!enrollment) throw new NotFoundError('Enrollment');

    const isOwnEnrollment = String(enrollment.studentId) === requester.id;
    if (!isOwnEnrollment) {
      await this.courses.ensureCanManageCourse(String(enrollment.courseId), requester);
    } else if (input.status !== 'dropped') {
      throw new ForbiddenError('Students may only drop their own enrollment.');
    }

    const updated = await this.repository.updateById(enrollmentId, {
      $set: { status: input.status },
    });
    if (!updated) throw new NotFoundError('Enrollment');
    return updated;
  }
}

export const enrollmentService = new EnrollmentService();
