import { BaseRepository } from '@database/baseRepository';
import { DoubtReplyDocument, DoubtReplyModel } from './doubtReply.model';

export class DoubtReplyRepository extends BaseRepository<DoubtReplyDocument> {
  constructor() {
    super(DoubtReplyModel);
  }

  async findByDoubt(doubtId: string): Promise<DoubtReplyDocument[]> {
    return DoubtReplyModel.find({ doubtId }).sort({ createdAt: 1 }).lean<DoubtReplyDocument[]>().exec();
  }
}

export const doubtReplyRepository = new DoubtReplyRepository();
