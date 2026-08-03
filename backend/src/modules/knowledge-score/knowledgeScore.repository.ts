import { BaseRepository } from '@database/baseRepository';
import { KnowledgeScoreDocument, KnowledgeScoreModel } from './knowledgeScore.model';

export class KnowledgeScoreRepository extends BaseRepository<KnowledgeScoreDocument> {
  constructor() {
    super(KnowledgeScoreModel);
  }

  async findOneByStudentAndTopic(
    studentId: string,
    topicId: string
  ): Promise<KnowledgeScoreDocument | null> {
    return KnowledgeScoreModel.findOne({ studentId, topicId }).exec();
  }

  async findByStudent(studentId: string): Promise<KnowledgeScoreDocument[]> {
    return KnowledgeScoreModel.find({ studentId }).lean<KnowledgeScoreDocument[]>().exec();
  }

  async upsert(
    studentId: string,
    topicId: string,
    currentScore: number,
    attemptsCount: number
  ): Promise<KnowledgeScoreDocument> {
    const updated = await KnowledgeScoreModel.findOneAndUpdate(
      { studentId, topicId },
      { $set: { currentScore, attemptsCount, lastUpdatedAt: new Date() } },
      { upsert: true, new: true }
    ).exec();
    return updated as KnowledgeScoreDocument;
  }
}

export const knowledgeScoreRepository = new KnowledgeScoreRepository();
