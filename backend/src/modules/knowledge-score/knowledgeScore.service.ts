import {
  knowledgeScoreRepository,
  KnowledgeScoreRepository,
} from './knowledgeScore.repository';
import {
  knowledgeScoreHistoryRepository,
  KnowledgeScoreHistoryRepository,
} from './knowledgeScoreHistory.repository';
import { defaultScoringEngine, ScoringEngine } from './scoringEngine';
import { KnowledgeScoreDocument } from './knowledgeScore.model';
import { KnowledgeScoreHistoryDocument } from './knowledgeScoreHistory.model';
import { KnowledgeScoreDTO } from './knowledgeScore.types';

export interface KnowledgeScoreHistoryEntryDTO {
  topicId: string;
  score: number;
  recordedAt: Date;
}

const WEAK_TOPIC_THRESHOLD = 60;

export class KnowledgeScoreService {
  constructor(
    private readonly repository: KnowledgeScoreRepository = knowledgeScoreRepository,
    private readonly historyRepository: KnowledgeScoreHistoryRepository = knowledgeScoreHistoryRepository,
    // Injected so the aggregation algorithm can be swapped without changing
    // any caller (AiTestService) or this service's public interface.
    private readonly scoringEngine: ScoringEngine = defaultScoringEngine
  ) {}

  toDTO(score: KnowledgeScoreDocument): KnowledgeScoreDTO {
    return {
      topicId: String(score.topicId),
      currentScore: score.currentScore,
      attemptsCount: score.attemptsCount,
      lastUpdatedAt: score.lastUpdatedAt,
    };
  }

  /** Called by AiTestService (cross-module, service-to-service) after grading an attempt. */
  async recordAttempt(
    studentId: string,
    topicId: string,
    attemptId: string,
    latestAttemptScore: number
  ): Promise<KnowledgeScoreDocument> {
    const existing = await this.repository.findOneByStudentAndTopic(studentId, topicId);

    const newAggregate = this.scoringEngine.computeAggregate({
      previousScore: existing?.currentScore ?? null,
      previousAttemptsCount: existing?.attemptsCount ?? 0,
      latestAttemptScore,
    });

    const updated = await this.repository.upsert(
      studentId,
      topicId,
      newAggregate,
      (existing?.attemptsCount ?? 0) + 1
    );

    await this.historyRepository.create({
      studentId: studentId as unknown as KnowledgeScoreHistoryDocument['studentId'],
      topicId: topicId as unknown as KnowledgeScoreHistoryDocument['topicId'],
      score: newAggregate,
      recordedAt: new Date(),
      triggeredBy: attemptId as unknown as KnowledgeScoreHistoryDocument['triggeredBy'],
    });

    return updated;
  }

  async listMine(studentId: string): Promise<KnowledgeScoreDocument[]> {
    return this.repository.findByStudent(studentId);
  }

  async listWeakTopics(studentId: string): Promise<KnowledgeScoreDocument[]> {
    const scores = await this.repository.findByStudent(studentId);
    return scores
      .filter((score) => score.currentScore < WEAK_TOPIC_THRESHOLD)
      .sort((a, b) => a.currentScore - b.currentScore);
  }

  /** Growth-analytics timeline, ascending by time. Used by AnalyticsService (cross-module). */
  async getHistoryMine(studentId: string): Promise<KnowledgeScoreHistoryEntryDTO[]> {
    const history = await this.historyRepository.findByStudent(studentId);
    return history.map((entry) => ({
      topicId: String(entry.topicId),
      score: entry.score,
      recordedAt: entry.recordedAt,
    }));
  }
}

export const knowledgeScoreService = new KnowledgeScoreService();
