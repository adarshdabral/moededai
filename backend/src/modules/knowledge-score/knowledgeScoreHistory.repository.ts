import { BaseRepository } from '@database/baseRepository';
import {
  KnowledgeScoreHistoryDocument,
  KnowledgeScoreHistoryModel,
} from './knowledgeScoreHistory.model';

export class KnowledgeScoreHistoryRepository extends BaseRepository<KnowledgeScoreHistoryDocument> {
  constructor() {
    super(KnowledgeScoreHistoryModel);
  }

  async findByStudentAndTopic(
    studentId: string,
    topicId: string
  ): Promise<KnowledgeScoreHistoryDocument[]> {
    return KnowledgeScoreHistoryModel.find({ studentId, topicId })
      .sort({ recordedAt: 1 })
      .lean<KnowledgeScoreHistoryDocument[]>()
      .exec();
  }

  async findByStudent(studentId: string): Promise<KnowledgeScoreHistoryDocument[]> {
    return KnowledgeScoreHistoryModel.find({ studentId })
      .sort({ recordedAt: 1 })
      .lean<KnowledgeScoreHistoryDocument[]>()
      .exec();
  }
}

export const knowledgeScoreHistoryRepository = new KnowledgeScoreHistoryRepository();
