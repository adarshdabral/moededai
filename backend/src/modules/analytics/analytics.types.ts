import { KnowledgeScoreDTO } from '@modules/knowledge-score/knowledgeScore.types';
import { KnowledgeScoreHistoryEntryDTO } from '@modules/knowledge-score/knowledgeScore.service';

export interface GrowthAnalyticsDTO {
  topicMastery: KnowledgeScoreDTO[];
  progressTimeline: KnowledgeScoreHistoryEntryDTO[];
  learningStreakDays: number;
}

export interface StudentComparativeEntryDTO {
  studentId: string;
  averageScore: number;
  topicsAssessed: number;
}
