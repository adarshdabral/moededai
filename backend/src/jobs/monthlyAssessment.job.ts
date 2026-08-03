import { logger } from '@config/logger';
import { monthlyAssessmentService } from '@modules/assessment/monthlyAssessment.service';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Automatic scheduling for monthly assessments (opens/closes windows on
 * time), per the "Automatic scheduling" feature requirement. No queue system
 * is used here by design (tech stack has none) - a periodic in-process check
 * is sufficient at this scale; see docs/ARCHITECTURE.md §9 for how this could
 * move to a real scheduler later if needed.
 */
export async function runMonthlyAssessmentCheck(): Promise<void> {
  try {
    const { opened, closed } = await monthlyAssessmentService.runScheduler();
    if (opened > 0 || closed > 0) {
      logger.info('Monthly assessment scheduler ran', { opened, closed });
    }
  } catch (error) {
    logger.error('Monthly assessment scheduler failed', { error });
  }
}

export function startMonthlyAssessmentScheduler(): NodeJS.Timeout {
  return setInterval(() => {
    void runMonthlyAssessmentCheck();
  }, CHECK_INTERVAL_MS);
}
