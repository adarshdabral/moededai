import { NotFoundError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { storageClient } from '@common/storage';
import { courseService, CourseService } from './course.service';
import { assignmentRepository, AssignmentRepository } from './assignment.repository';
import { AssignmentDocument } from './assignment.model';
import { AssignmentDTO } from './course.types';
import { CreateAssignmentInput, UpdateAssignmentInput } from './course.validation';

export class AssignmentService {
  constructor(
    private readonly repository: AssignmentRepository = assignmentRepository,
    private readonly courses: CourseService = courseService
  ) {}

  toDTO(assignment: AssignmentDocument): AssignmentDTO {
    return {
      id: String(assignment._id),
      courseId: String(assignment.courseId),
      title: assignment.title,
      description: assignment.description,
      dueAt: assignment.dueAt,
      attachmentUrl: assignment.attachmentUrl,
      createdBy: String(assignment.createdBy),
    };
  }

  async create(
    courseId: string,
    requester: AuthenticatedUser,
    input: CreateAssignmentInput,
    file?: Express.Multer.File
  ): Promise<AssignmentDocument> {
    await this.courses.ensureCanManageCourse(courseId, requester);

    let attachmentUrl: string | undefined;
    let attachmentStorageKey: string | undefined;
    if (file) {
      const stored = await storageClient.save({
        category: 'assignments',
        originalName: file.originalname,
        mimeType: file.mimetype,
        buffer: file.buffer,
      });
      attachmentUrl = stored.url;
      attachmentStorageKey = stored.key;
    }

    return this.repository.create({
      courseId: courseId as unknown as AssignmentDocument['courseId'],
      title: input.title,
      description: input.description,
      dueAt: input.dueAt,
      attachmentUrl,
      attachmentStorageKey,
      createdBy: requester.id as unknown as AssignmentDocument['createdBy'],
    });
  }

  async listByCourse(courseId: string): Promise<AssignmentDocument[]> {
    await this.courses.getById(courseId);
    return this.repository.findByCourse(courseId);
  }

  async getById(assignmentId: string): Promise<AssignmentDocument> {
    const assignment = await this.repository.findById(assignmentId);
    if (!assignment) throw new NotFoundError('Assignment');
    return assignment;
  }

  async update(
    assignmentId: string,
    requester: AuthenticatedUser,
    updates: UpdateAssignmentInput
  ): Promise<AssignmentDocument> {
    const assignment = await this.getById(assignmentId);
    await this.courses.ensureCanManageCourse(String(assignment.courseId), requester);

    const updated = await this.repository.updateById(assignmentId, { $set: updates });
    if (!updated) throw new NotFoundError('Assignment');
    return updated;
  }

  async delete(assignmentId: string, requester: AuthenticatedUser): Promise<void> {
    const assignment = await this.getById(assignmentId);
    await this.courses.ensureCanManageCourse(String(assignment.courseId), requester);

    if (assignment.attachmentStorageKey) {
      await storageClient.delete(assignment.attachmentStorageKey);
    }
    await this.repository.deleteById(assignmentId);
  }
}

export const assignmentService = new AssignmentService();
