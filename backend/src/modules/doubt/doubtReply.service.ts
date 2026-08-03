import { ForbiddenError, NotFoundError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { ROLES } from '@common/constants/roles';
import { userService, UserService } from '@modules/user/user.service';
import { doubtService, DoubtService } from './doubt.service';
import { doubtReplyRepository, DoubtReplyRepository } from './doubtReply.repository';
import { DoubtReplyDocument } from './doubtReply.model';
import { DoubtReplyDTO } from './doubt.types';
import { CreateReplyInput } from './doubt.validation';

export class DoubtReplyService {
  constructor(
    private readonly repository: DoubtReplyRepository = doubtReplyRepository,
    private readonly doubts: DoubtService = doubtService,
    private readonly users: UserService = userService
  ) {}

  toDTO(reply: DoubtReplyDocument): DoubtReplyDTO {
    return {
      id: String(reply._id),
      doubtId: String(reply.doubtId),
      authorRole: reply.authorRole,
      authorRef: reply.authorRef,
      message: reply.message,
      createdAt: reply.createdAt,
    };
  }

  async create(
    doubtId: string,
    requester: AuthenticatedUser,
    input: CreateReplyInput
  ): Promise<DoubtReplyDocument> {
    const doubt = await this.doubts.getById(doubtId);
    const isOwner = await this.doubts.isOwnDoubt(doubt, requester);

    let authorRole: 'teacher' | 'anonymous_student';
    let authorRef: string;

    if (isOwner) {
      const self = await this.users.getById(requester.id);
      authorRole = 'anonymous_student';
      authorRef = self.anonymousId;
    } else if (requester.role === ROLES.TEACHER || requester.role === ROLES.ADMIN) {
      await this.doubts.ensureCanAccessDoubt(doubt, requester);
      authorRole = 'teacher';
      authorRef = requester.id;
    } else {
      throw new ForbiddenError('You cannot reply to this doubt.');
    }

    return this.repository.create({
      doubtId: doubtId as unknown as DoubtReplyDocument['doubtId'],
      authorRole,
      authorRef,
      message: input.message,
    });
  }

  async listByDoubt(doubtId: string, requester: AuthenticatedUser): Promise<DoubtReplyDocument[]> {
    const doubt = await this.doubts.getById(doubtId);
    await this.doubts.ensureCanAccessDoubt(doubt, requester);
    return this.repository.findByDoubt(doubtId);
  }

  async getById(replyId: string): Promise<DoubtReplyDocument> {
    const reply = await this.repository.findById(replyId);
    if (!reply) throw new NotFoundError('Reply');
    return reply;
  }
}

export const doubtReplyService = new DoubtReplyService();
