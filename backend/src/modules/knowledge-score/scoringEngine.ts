export interface ScoringEngineInput {
  /** The student's current aggregate score for this topic, or null if this is their first attempt. */
  previousScore: number | null;
  /** How many attempts have already contributed to previousScore. */
  previousAttemptsCount: number;
  /** The raw 0-100 score of the attempt just graded. */
  latestAttemptScore: number;
}

/**
 * The Knowledge Score aggregation algorithm is deliberately isolated behind
 * this interface so it can be swapped (e.g. for a different weighting model,
 * decay curve, or ML-driven estimator) without touching KnowledgeScoreService
 * or any caller - see CLAUDE.md ("the scoring algorithm should be replaceable
 * without changing the rest of the system").
 */
export interface ScoringEngine {
  computeAggregate(input: ScoringEngineInput): number;
}

const RECENCY_WEIGHT = 0.4;

/**
 * Default strategy: a recency-weighted moving average. The most recent
 * attempt counts for RECENCY_WEIGHT of the new aggregate, and the previous
 * aggregate (itself already an accumulation of prior attempts) makes up the
 * rest - so the score adapts to recent performance without discarding
 * historical signal entirely.
 */
export class WeightedRecentAverageScoringEngine implements ScoringEngine {
  computeAggregate(input: ScoringEngineInput): number {
    if (input.previousScore === null || input.previousAttemptsCount === 0) {
      return clampScore(input.latestAttemptScore);
    }
    const blended =
      input.previousScore * (1 - RECENCY_WEIGHT) + input.latestAttemptScore * RECENCY_WEIGHT;
    return clampScore(blended);
  }
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
}

export const defaultScoringEngine: ScoringEngine = new WeightedRecentAverageScoringEngine();
