import { ForbiddenError, NotFoundError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { courseService, CourseService } from '@modules/course/course.service';
import { userService, UserService } from '@modules/user/user.service';
import { doubtRepository, DoubtRepository } from './doubt.repository';
import { AnonymousDoubtDocument, DoubtStatus } from './anonymousDoubt.model';
import { DoubtDTO } from './doubt.types';
import { CreateDoubtInput, UpdateDoubtStatusInput } from './doubt.validation';

export class DoubtService {
  constructor(
    private readonly repository: DoubtRepository = doubtRepository,
    private readonly courses: CourseService = courseService,
    private readonly users: UserService = userService
  ) {}

  /**
   * Deliberately returns only fields that already exist on the anonymous
   * document itself - never resolves or exposes the author's real identity.
   * See docs/ARCHITECTURE.md §8.
   */
  toDTO(doubt: AnonymousDoubtDocument): DoubtDTO {
    return {
      id: String(doubt._id),
      authorAnonymousId: doubt.authorAnonymousId,
      courseId: String(doubt.courseId),
      topicId: doubt.topicId ? String(doubt.topicId) : undefined,
      question: doubt.question,
      status: doubt.status,
      createdAt: doubt.createdAt,
    };
  }

  async post(requester: AuthenticatedUser, input: CreateDoubtInput): Promise<AnonymousDoubtDocument> {
    await this.courses.getById(input.courseId);
    // A forward lookup only (own id -> own anonymousId) - never the reverse.
    const self = await this.users.getById(requester.id);

    return this.repository.create({
      authorAnonymousId: self.anonymousId,
      courseId: input.courseId as unknown as AnonymousDoubtDocument['courseId'],
      topicId: input.topicId as unknown as AnonymousDoubtDocument['topicId'],
      question: input.question,
      status: 'open',
    });
  }

  /** Teacher/admin course inbox. Structurally incapable of resolving identity - see class doc. */
  async listByCourse(
    courseId: string,
    requester: AuthenticatedUser,
    status?: DoubtStatus
  ): Promise<AnonymousDoubtDocument[]> {
    await this.courses.ensureCanManageCourse(courseId, requester);
    return this.repository.findByCourse(courseId, status);
  }

  /** The student's own posted doubts, matched by their own anonymousId (never by userId). */
  async listMine(requester: AuthenticatedUser): Promise<AnonymousDoubtDocument[]> {
    const self = await this.users.getById(requester.id);
    return this.repository.findByAuthorAnonymousId(self.anonymousId);
  }

  async getById(doubtId: string): Promise<AnonymousDoubtDocument> {
    const doubt = await this.repository.findById(doubtId);
    if (!doubt) throw new NotFoundError('Doubt');
    return doubt;
  }

  /** Returns true if requester is the anonymous author, without ever exposing that fact to callers. */
  async isOwnDoubt(doubt: AnonymousDoubtDocument, requester: AuthenticatedUser): Promise<boolean> {
    const self = await this.users.getById(requester.id);
    return self.anonymousId === doubt.authorAnonymousId;
  }

  async updateStatus(
    doubtId: string,
    requester: AuthenticatedUser,
    input: UpdateDoubtStatusInput
  ): Promise<AnonymousDoubtDocument> {
    const doubt = await this.getById(doubtId);
    await this.courses.ensureCanManageCourse(String(doubt.courseId), requester);

    const updated = await this.repository.updateById(doubtId, { $set: { status: input.status } });
    if (!updated) throw new NotFoundError('Doubt');
    return updated;
  }

  /** Throws if requester is neither the course's teacher/admin nor the anonymous author. */
  async ensureCanAccessDoubt(
    doubt: AnonymousDoubtDocument,
    requester: AuthenticatedUser
  ): Promise<void> {
    const isOwner = await this.isOwnDoubt(doubt, requester);
    if (isOwner) return;
    try {
      await this.courses.ensureCanManageCourse(String(doubt.courseId), requester);
    } catch {
      throw new ForbiddenError('You cannot access this doubt.');
    }
  }
}

export const doubtService = new DoubtService();
