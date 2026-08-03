import { BaseRepository } from '@database/baseRepository';
import { AnonymousDoubtDocument, AnonymousDoubtModel, DoubtStatus } from './anonymousDoubt.model';

export class DoubtRepository extends BaseRepository<AnonymousDoubtDocument> {
  constructor() {
    super(AnonymousDoubtModel);
  }

  async findByCourse(
    courseId: string,
    status?: DoubtStatus
  ): Promise<AnonymousDoubtDocument[]> {
    const filter: Record<string, unknown> = { courseId };
    if (status) filter.status = status;
    return AnonymousDoubtModel.find(filter).sort({ createdAt: -1 }).lean<AnonymousDoubtDocument[]>().exec();
  }

  async findByAuthorAnonymousId(anonymousId: string): Promise<AnonymousDoubtDocument[]> {
    return AnonymousDoubtModel.find({ authorAnonymousId: anonymousId })
      .sort({ createdAt: -1 })
      .lean<AnonymousDoubtDocument[]>()
      .exec();
  }
}

export const doubtRepository = new DoubtRepository();
