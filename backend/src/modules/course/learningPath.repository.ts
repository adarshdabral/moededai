import { BaseRepository } from '@database/baseRepository';
import { LearningPathDocument, LearningPathModel } from './learningPath.model';

export class LearningPathRepository extends BaseRepository<LearningPathDocument> {
  constructor() {
    super(LearningPathModel);
  }

  async findByCourse(courseId: string): Promise<LearningPathDocument[]> {
    return LearningPathModel.find({ courseId }).lean<LearningPathDocument[]>().exec();
  }
}

export const learningPathRepository = new LearningPathRepository();
