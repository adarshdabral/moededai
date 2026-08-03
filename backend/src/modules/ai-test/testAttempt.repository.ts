import { BaseRepository } from '@database/baseRepository';
import { TestAttemptDocument, TestAttemptModel } from './testAttempt.model';

export class TestAttemptRepository extends BaseRepository<TestAttemptDocument> {
  constructor() {
    super(TestAttemptModel);
  }

  async findByStudent(
    studentId: string,
    options: { skip?: number; limit?: number }
  ): Promise<TestAttemptDocument[]> {
    return TestAttemptModel.find({ studentId })
      .sort({ submittedAt: -1 })
      .skip(options.skip ?? 0)
      .limit(options.limit ?? 20)
      .lean<TestAttemptDocument[]>()
      .exec();
  }

  async countByStudent(studentId: string): Promise<number> {
    return TestAttemptModel.countDocuments({ studentId }).exec();
  }
}

export const testAttemptRepository = new TestAttemptRepository();
